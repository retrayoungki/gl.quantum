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

export default function ProfitLossReport() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [balances, setBalances] = useState<any>({});
  const [coa, setCoa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Company Info first to ensure header is ready
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
        console.error("Error loading Profit Loss data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [endDate]);

  const getAmount = (prefix: string) => {
    return coa
      .filter(a => a.code.startsWith(prefix) && a.level === "Rincian Akun")
      .reduce((sum, a) => sum + (balances[a.code]?.balance || 0), 0);
  };

  const totalRevenue = getAmount("4-");
  const totalCOGS = getAmount("5-");
  const totalSellingExp = getAmount("6-");
  const totalAdminExp = getAmount("7-");
  const otherIncome = getAmount("8-");
  const otherExp = getAmount("9-");

  const grossProfit = totalRevenue - totalCOGS;
  const operatingProfit = grossProfit - totalSellingExp - totalAdminExp;
  const netProfit = operatingProfit + otherIncome - otherExp;

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laba Rugi");

    worksheet.columns = [
      { key: "code", width: 15 },
      { key: "name", width: 45 },
      { key: "amount", width: 20 },
    ];

    const addSection = (titleId: string, titleEn: string, codes: string[]) => {
      worksheet.addRow([isEnglish ? titleEn : titleId]).font = { bold: true };
      let sectionTotal = 0;
      coa.filter(a => codes.some(c => a.code.startsWith(c)) && a.level === "Rincian Akun").forEach(acc => {
        const amt = balances[acc.code]?.balance || 0;
        worksheet.addRow([acc.code, acc.name, amt]).getCell(3).numFmt = "#,##0.00";
        sectionTotal += amt;
      });
      const totalRow = worksheet.addRow(["", `Total ${isEnglish ? titleEn : titleId}`, sectionTotal]);
      totalRow.font = { bold: true };
      totalRow.getCell(3).numFmt = "#,##0.00";
      worksheet.addRow([]);
      return sectionTotal;
    };

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "PROFIT AND LOSS STATEMENT" : "LAPORAN LABA ATAU RUGI"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "Period" : "Periode"}: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`]);
    worksheet.addRow([]);

    addSection("PENJUALAN", "SALES", ["4-"]);
    addSection("HARGA POKOK PENJUALAN", "COST OF GOODS SOLD", ["5-"]);
    
    const grossRow = worksheet.addRow(["", isEnglish ? "GROSS PROFIT (LOSS)" : "LABA (RUGI) KOTOR", grossProfit]);
    grossRow.font = { bold: true };
    grossRow.getCell(3).numFmt = "#,##0.00";
    worksheet.addRow([]);

    addSection("BEBAN PENJUALAN", "SELLING EXPENSES", ["6-"]);
    addSection("BEBAN UMUM & ADM", "GENERAL & ADMIN EXPENSES", ["7-"]);

    const opRow = worksheet.addRow(["", isEnglish ? "OPERATING PROFIT" : "LABA USAHA", operatingProfit]);
    opRow.font = { bold: true };
    opRow.getCell(3).numFmt = "#,##0.00";
    worksheet.addRow([]);

    const netRow = worksheet.addRow(["", isEnglish ? "TOTAL PROFIT (LOSS)" : "TOTAL LABA (RUGI) BERSIH", netProfit]);
    netRow.font = { bold: true, size: 12 };
    netRow.getCell(3).numFmt = "#,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `LabaRugi_${format(endDate, 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
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

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
               <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Dari</label>
                  <DatePicker 
                    selected={startDate} 
                    onChange={(date) => setStartDate(date || new Date())} 
                    dateFormat="dd/MM/yyyy"
                    className="bg-transparent outline-none text-sm font-bold text-slate-700 w-24"
                  />
               </div>
               <span className="text-slate-300 font-black px-2">/</span>
               <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Sampai</label>
                  <DatePicker 
                    selected={endDate} 
                    onChange={(date) => setEndDate(date || new Date())} 
                    dateFormat="dd/MM/yyyy"
                    className="bg-transparent outline-none text-sm font-bold text-slate-700 w-24"
                  />
               </div>
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
             <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
             <div>
                <p className="text-slate-900 font-black text-lg">Menghitung Laba Rugi...</p>
                <p className="text-slate-400 text-sm font-medium">Sistem sedang memproses data transaksi Anda.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-16 shadow-xl border border-slate-200 rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1 mb-12">
              <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
              <div className="pt-8 border-b-4 border-slate-900 pb-4">
                <h2 className="text-xl font-black uppercase">{t("profit_loss", isEnglish)}</h2>
                {isEnglish ? null : <p className="text-sm italic text-slate-500 uppercase">Statement of Profit or Loss</p>}
                <p className="mt-4 font-bold text-sm bg-slate-900 text-white inline-block px-6 py-1 rounded-full italic tracking-widest uppercase">
                  {t("period", isEnglish)}: {format(startDate, "dd/MM/yyyy")} — {format(endDate, "dd/MM/yyyy")}
                </p>
                <p className="text-[10px] text-slate-400 italic mt-3">({isEnglish ? "Expressed in Rupiah" : "Dinyatakan dalam Rupiah"})</p>
              </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-2">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-1 text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-slate-900">{t("PENDAPATAN USAHA", isEnglish)}</span>
                      {!isEnglish && <span className="text-[10px] italic text-slate-500">NET SALES</span>}
                    </div>
                  </div>
                  <div className="pl-4 space-y-1">
                    {coa.filter(a => a.code.startsWith("4-") && a.level === "Rincian Akun").map(acc => (
                       <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                          <div className="flex gap-4">
                            <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                            <span className="text-slate-700">{t(acc.name, isEnglish)}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                       </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-900">
                     <span className="uppercase">Total {t("PENDAPATAN USAHA", isEnglish)}</span>
                     <span>{formatCurrency(totalRevenue)}</span>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-1 text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-slate-900">{t("cogs", isEnglish)}</span>
                      {!isEnglish && <span className="text-[10px] italic text-slate-500">COST OF GOODS SOLD</span>}
                    </div>
                  </div>
                  <div className="pl-4 space-y-1">
                    {coa.filter(a => a.code.startsWith("5-") && a.level === "Rincian Akun").map(acc => (
                       <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                          <div className="flex gap-4">
                            <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                            <span className="text-slate-700">{acc.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                       </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-900">
                     <span className="uppercase">Total {t("cogs", isEnglish)}</span>
                     <span>{formatCurrency(totalCOGS)}</span>
                  </div>
               </div>

               <div className="flex justify-between items-center py-3 bg-slate-900 text-white px-4 font-black uppercase text-sm rounded shadow-lg">
                  <span>{t("gross_profit", isEnglish)}</span>
                  <span>{formatCurrency(grossProfit)}</span>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-1 text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-slate-900">SELLING EXPENSES</span>
                      <span className="text-[10px] italic text-slate-500">BEBAN PENJUALAN</span>
                    </div>
                  </div>
                  <div className="pl-4 space-y-1">
                    {coa.filter(a => a.code.startsWith("6-") && a.level === "Rincian Akun").map(acc => (
                       <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                          <div className="flex gap-4">
                            <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                            <span className="text-slate-700">{acc.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                       </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-900">
                     <span className="uppercase">Total {t("BEBAN OPERASIONAL", isEnglish)}</span>
                     <span>{formatCurrency(totalSellingExp)}</span>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-1 text-left">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-slate-900">GENERAL AND ADMINISTRATIVE EXPENSES</span>
                      <span className="text-[10px] italic text-slate-500">BEBAN UMUM DAN ADMINISTRASI</span>
                    </div>
                  </div>
                  <div className="pl-4 space-y-1">
                    {coa.filter(a => a.code.startsWith("7-") && a.level === "Rincian Akun").map(acc => (
                       <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                          <div className="flex gap-4">
                            <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                            <span className="text-slate-700">{acc.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                       </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-900">
                     <span className="uppercase">Total {t("BEBAN ADMINISTRASI & UMUM", isEnglish)}</span>
                     <span>{formatCurrency(totalAdminExp)}</span>
                  </div>
               </div>

               <div className="flex justify-between items-center py-3 bg-slate-100 px-4 font-black uppercase text-sm border-y-2 border-slate-900 shadow-inner">
                  <span>{t("operating_profit", isEnglish)}</span>
                  <span>{formatCurrency(operatingProfit)}</span>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                     <div className="flex justify-between items-baseline border-b border-slate-200 pb-1 text-left">
                       <div className="flex flex-col">
                         <span className="text-xs font-black uppercase text-slate-900">OTHER INCOME (EXPENSES)</span>
                         <span className="text-[10px] italic text-slate-500">PENDAPATAN (BEBAN) LAIN-LAIN</span>
                       </div>
                     </div>
                     <div className="pl-4 space-y-1">
                        <div className="space-y-4">
                           <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                              <p className="text-[10px] font-bold text-blue-700 uppercase mb-2 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-sm">add_circle</span> Income / Pendapatan
                              </p>
                              {coa.filter(a => a.code.startsWith("8-") && a.level === "Rincian Akun").map(acc => (
                                 <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                                    <div className="flex gap-4">
                                      <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                                      <span className="text-slate-700">{acc.name}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                                 </div>
                              ))}
                           </div>
                           <div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100/50">
                              <p className="text-[10px] font-bold text-rose-700 uppercase mb-2 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-sm">remove_circle</span> Expenses / Beban
                              </p>
                              {coa.filter(a => a.code.startsWith("9-") && a.level === "Rincian Akun").map(acc => (
                                 <div key={acc.code} className="flex justify-between items-baseline text-xs py-0.5 text-left">
                                    <div className="flex gap-4">
                                      <span className="w-16 text-slate-400 font-mono">{acc.code}</span>
                                      <span className="text-slate-700">{acc.name}</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(balances[acc.code]?.balance || 0)}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-900">
                        <span className="uppercase">Total {t("PENDAPATAN & BEBAN LAIN-LAIN", isEnglish)}</span>
                        <span>{formatCurrency(otherIncome - otherExp)}</span>
                     </div>
                  </div>
               </div>

               <div className="flex justify-between items-center py-6 border-t-4 border-double border-slate-900 font-black uppercase text-2xl bg-slate-50 px-6 rounded-xl">
                  <div className="flex flex-col text-left">
                     <span>{t("net_profit", isEnglish)}</span>
                     {!isEnglish && <span className="text-xs italic text-slate-500 font-bold">TOTAL LABA (RUGI) BERSIH</span>}
                  </div>
                  <span className={netProfit >= 0 ? "text-emerald-600 drop-shadow-sm" : "text-rose-600 drop-shadow-sm"}>
                    {formatCurrency(netProfit)}
                  </span>
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
