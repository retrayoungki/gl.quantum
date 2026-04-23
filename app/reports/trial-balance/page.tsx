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

export default function TrialBalanceReport() {
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
        setCoa(coaData?.accounts?.filter((a: any) => a.level === "Rincian Akun") || []);
      } catch (error) {
        console.error("Error loading Trial Balance data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [endDate]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Trial Balance");

    worksheet.columns = [
      { header: isEnglish ? "Account No" : "No. Akun", key: "code", width: 15 },
      { header: isEnglish ? "Account Name" : "Nama Akun", key: "name", width: 35 },
      { header: isEnglish ? "Debit" : "Debet", key: "debit", width: 15 },
      { header: isEnglish ? "Credit" : "Kredit", key: "credit", width: 15 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "TRIAL BALANCE" : "NERACA SALDO"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "As of" : "Per Tanggal"}: ${format(endDate, "dd MMMM yyyy")}`]);
    worksheet.addRow([]);

    coa.forEach(acc => {
      const b = balances[acc.code] || { debit: 0, credit: 0 };
      worksheet.addRow({
        code: acc.code,
        name: acc.name,
        debit: b.debit,
        credit: b.credit,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `NeracaSaldo_${format(endDate, 'yyyyMMdd')}.xlsx`);
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

            <div className="flex flex-col text-left">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1">Per Tanggal</label>
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
             <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
             <div>
                <p className="text-slate-900 font-black text-lg">Menyusun Neraca Saldo...</p>
                <p className="text-slate-400 text-sm font-medium">Data sedang divalidasi.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-12 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="text-center space-y-1 mb-8">
               <h1 className="text-xl font-black uppercase text-slate-900">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
               <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
               <div className="pt-4 border-b-2 border-slate-900 pb-2">
                  <h2 className="text-lg font-black uppercase">{isEnglish ? "Trial Balance" : "Neraca Saldo"}</h2>
                  <p className="text-xs italic text-slate-500 uppercase">{isEnglish ? "Statement of Balances" : "Trial Balance"}</p>
                  <p className="text-sm font-bold mt-2 bg-slate-900 text-white inline-block px-4 py-1 rounded-full uppercase tracking-widest">
                    {t("as_of", isEnglish)} {format(endDate, isEnglish ? "MMMM dd, yyyy" : "dd MMMM yyyy")}
                  </p>
               </div>
            </div>

            <table className="w-full text-sm">
               <thead className="bg-slate-900 text-white">
                  <tr>
                     <th className="py-3 px-4 text-left rounded-tl">{isEnglish ? "Account No" : "No. Akun"}</th>
                     <th className="py-3 px-4 text-left">{isEnglish ? "Account Name" : "Nama Akun"}</th>
                     <th className="py-3 px-4 text-right">{isEnglish ? "Debit" : "Debet"}</th>
                     <th className="py-3 px-4 text-right rounded-tr">{isEnglish ? "Credit" : "Kredit"}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 border-b-2 border-slate-900">
                  {coa.map(acc => {
                    const b = balances[acc.code] || { debit: 0, credit: 0 };
                    if (b.debit === 0 && b.credit === 0) return null;
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                         <td className="py-2 px-4 font-mono text-xs text-slate-500 font-bold text-left">{acc.code}</td>
                         <td className="py-2 px-4 font-medium text-slate-700 text-left">{t(acc.name, isEnglish)}</td>
                         <td className="py-2 px-4 text-right font-bold text-slate-900">{b.debit > 0 ? formatCurrency(b.debit) : "-"}</td>
                         <td className="py-2 px-4 text-right font-bold text-slate-900">{b.credit > 0 ? formatCurrency(b.credit) : "-"}</td>
                      </tr>
                    );
                  })}
               </tbody>
               <tfoot className="font-black bg-slate-50">
                  <tr>
                     <td colSpan={2} className="py-4 px-4 text-right uppercase tracking-widest text-slate-500">Total</td>
                     <td className="py-4 px-4 text-right text-lg">{formatCurrency(coa.reduce((s, a) => s + (balances[a.code]?.debit || 0), 0))}</td>
                     <td className="py-4 px-4 text-right text-lg">{formatCurrency(coa.reduce((s, a) => s + (balances[a.code]?.credit || 0), 0))}</td>
                  </tr>
               </tfoot>
            </table>
          </div>
        )}
        <style jsx global>{`
          @media print { .no-print { display: none !important; } }
        `}</style>
      </div>
    </div>
  );
}
