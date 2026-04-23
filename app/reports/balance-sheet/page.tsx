"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyInfo, getCOAData } from "@/lib/dataService";
import { getAccountBalances, formatCurrency } from "@/lib/reportUtils";
import { t } from "@/lib/translations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BalanceSheetReport() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [balances, setBalances] = useState<any>({});
  const [coa, setCoa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const info = await getCompanyInfo();
        if (info) setCompanyInfo(info);

        const endStr = format(endDate, 'yyyy-MM-dd');
        const [balanceData, coaData] = await Promise.all([
          getAccountBalances(endStr),
          getCOAData()
        ]);
        setBalances(balanceData);
        setCoa(coaData?.accounts || []);
      } catch (error) {
        console.error("Error loading Balance Sheet data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [endDate]);

  const getAmount = (code: string) => {
    const account = coa.find(a => a.code === code);
    
    // Dynamic calculation for Current Year Earnings
    if (account && (account.name.toLowerCase().includes("tahun berjalan") || code === "3-3000" || code === "3-2000")) {
      let revenue = 0;
      let expenses = 0;
      coa.filter(a => a.level === "Rincian Akun").forEach(a => {
        const b = balances[a.code] || { debit: 0, credit: 0 };
        const prefix = a.code.charAt(0);
        if (prefix === '4') revenue += (b.credit - b.debit);
        else if (['5', '6', '7', '8'].includes(prefix)) expenses += (b.debit - b.credit);
      });
      return revenue - expenses;
    }

    if (!account) return 0;
    
    // Summing logic based on section (1: Assets, 2-3: Liab/Equity)
    const prefix = code.charAt(0);
    const isAsset = prefix === '1';

    if (account.level !== "Rincian Akun") {
      return coa
        .filter(a => a.code.startsWith(code) && a.level === "Rincian Akun")
        .reduce((sum, a) => {
          const b = balances[a.code] || { debit: 0, credit: 0 };
          const opening = a.saldo || 0;
          const isDebitNormal = a.normalBalance === "Debit";
          
          if (isAsset) {
            // For Assets: (Opening + Debit - Credit)
            // If opening is Kredit-normal, it should be subtracted? 
            // Usually Asset opening balances are Debit.
            const totalDebit = (isDebitNormal ? opening : 0) + b.debit;
            const totalCredit = (!isDebitNormal ? opening : 0) + b.credit;
            return sum + (totalDebit - totalCredit);
          } else {
            // For Liab/Equity: (Opening + Credit - Debit)
            const totalDebit = (isDebitNormal ? opening : 0) + b.debit;
            const totalCredit = (!isDebitNormal ? opening : 0) + b.credit;
            return sum + (totalCredit - totalDebit);
          }
        }, 0);
    }

    const b = balances[code] || { debit: 0, credit: 0 };
    const opening = account.saldo || 0;
    const isDebitNormal = account.normalBalance === "Debit";
    const totalDebit = (isDebitNormal ? opening : 0) + b.debit;
    const totalCredit = (!isDebitNormal ? opening : 0) + b.credit;
    
    return isAsset ? (totalDebit - totalCredit) : (totalCredit - totalDebit);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Neraca");

    worksheet.columns = [
      { key: "code", width: 15 },
      { key: "name", width: 50 },
      { key: "amount", width: 20 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "STATEMENT OF FINANCIAL POSITION" : "LAPORAN POSISI KEUANGAN"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "As of" : "Per Tanggal"}: ${format(endDate, "dd MMMM yyyy")}`]);
    worksheet.addRow([]);

    coa.filter(a => a.level !== "Rincian Akun").forEach(acc => {
      const row = worksheet.addRow([acc.code, acc.name, getAmount(acc.code)]);
      row.font = { bold: true };
      row.getCell(3).numFmt = "#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Neraca_${format(endDate, 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => window.history.back()} className="text-slate-500 font-bold flex items-center gap-2 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all">
            <span className="material-symbols-outlined">arrow_back</span> Kembali
          </button>
          
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-200 transition-all border border-slate-200">
               <input 
                 type="checkbox" 
                 checked={isEnglish} 
                 onChange={e => setIsEnglish(e.target.checked)}
                 className="w-4 h-4 accent-blue-600"
               />
               <span className="text-xs font-black text-slate-700 uppercase">English Mode</span>
            </label>

            <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 text-left">Per Tanggal</label>
               <DatePicker 
                 selected={endDate} 
                 onChange={(date) => setEndDate(date || new Date())} 
                 dateFormat="dd/MM/yyyy"
                 className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 w-32"
               />
            </div>
            <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">description</span> Excel
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-24 rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center justify-center gap-4 text-center">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Laporan Posisi Keuangan...</p>
          </div>
        ) : (
          <div className="bg-white p-16 shadow-xl border border-slate-200 rounded-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-1 mb-12">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
              <div className="pt-6 border-b-2 border-slate-900 pb-4">
                <h2 className="text-xl font-black uppercase">{t("balance_sheet", isEnglish)}</h2>
                {isEnglish ? null : <p className="text-sm italic text-slate-500 uppercase">Statement of Financial Position</p>}
                <p className="mt-2 font-bold text-sm bg-slate-100 inline-block px-4 py-1 rounded-full text-slate-700 uppercase tracking-widest">
                  {t("as_of", isEnglish)} {format(endDate, isEnglish ? "MMMM dd, yyyy" : "dd MMMM yyyy")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
               <div>
                  <h3 className="bg-slate-900 text-white px-4 py-1.5 text-sm font-bold uppercase flex justify-between rounded-t">
                     <span>{t("assets", isEnglish)}</span>
                     <span>{formatCurrency(getAmount("1"))}</span>
                  </h3>
                  <div className="mt-4 space-y-4">
                     {coa.filter(a => a.code.startsWith("1-") && a.level !== "Rincian Akun").map(acc => (
                       <div key={acc.code} className={`flex justify-between items-baseline py-1 text-left ${acc.level === "Sub Akun" ? 'font-bold' : ''}`} style={{ paddingLeft: `${(acc.level === "Sub Akun" ? 1 : 0) * 1.5}rem` }}>
                         <div className="flex gap-8">
                           <span className="w-24 text-slate-500 font-mono text-xs">{acc.code}</span>
                           <div className="flex flex-col">
                             <span className="uppercase text-xs">{t(acc.name, isEnglish)}</span>
                             {!isEnglish && <span className="text-[10px] italic text-slate-500">{t(acc.name, true)}</span>}
                           </div>
                         </div>
                         <span className="text-sm">{formatCurrency(getAmount(acc.code))}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  <div>
                    <h3 className="bg-slate-900 text-white px-4 py-1.5 text-sm font-bold uppercase flex justify-between rounded-t">
                      <span>{t("liabilities_equity", isEnglish)}</span>
                      <span>{formatCurrency(getAmount("2") + getAmount("3"))}</span>
                    </h3>
                    <div className="mt-4 space-y-4">
                      {coa.filter(a => (a.code.startsWith("2-") || a.code.startsWith("3-")) && a.level !== "Rincian Akun").map(acc => (
                        <div key={acc.code} className={`flex justify-between items-baseline py-1 text-left ${acc.level === "Sub Akun" ? 'font-bold' : ''}`} style={{ paddingLeft: `${(acc.level === "Sub Akun" ? 1 : 0) * 1.5}rem` }}>
                          <div className="flex gap-8">
                            <span className="w-24 text-slate-500 font-mono text-xs">{acc.code}</span>
                            <div className="flex flex-col">
                              <span className="uppercase text-xs">{t(acc.name, isEnglish)}</span>
                              {!isEnglish && <span className="text-[10px] italic text-slate-500">{t(acc.name, true)}</span>}
                            </div>
                          </div>
                          <span className="text-sm">{formatCurrency(getAmount(acc.code))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-12 pt-8 border-t-4 border-double border-slate-900 flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                <span className="text-lg font-black uppercase text-slate-700">{isEnglish ? "Balance Check" : "Pemeriksaan Keseimbangan"}</span>
                <div className="flex flex-col items-end">
                   <span className={`text-xl font-black ${Math.abs(getAmount("1") - (getAmount("2") + getAmount("3"))) < 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {formatCurrency(getAmount("1") - (getAmount("2") + getAmount("3")))}
                   </span>
                   {Math.abs(getAmount("1") - (getAmount("2") + getAmount("3"))) < 1 && (
                     <span className="text-[10px] text-emerald-500 font-bold uppercase flex items-center gap-1">
                       <span className="material-symbols-outlined text-sm">check_circle</span> {isEnglish ? "Balanced" : "Seimbang"}
                     </span>
                   )}
                </div>
            </div>
          </div>
        )}
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .bg-white { border: none !important; box-shadow: none !important; padding: 0 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
