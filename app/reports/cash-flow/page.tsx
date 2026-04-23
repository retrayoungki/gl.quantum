"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getCompanyInfo, getCOAData } from "@/lib/dataService";
import { getAllTransactions, formatCurrency } from "@/lib/reportUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CashFlowReport() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coa, setCoa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const info = await getCompanyInfo();
        if (info) setCompanyInfo(info);

        const [allTrans, coaData] = await Promise.all([
          getAllTransactions(),
          getCOAData()
        ]);
        setTransactions(allTrans);
        setCoa(coaData?.accounts || []);
      } catch (error) {
        console.error("Error loading Cash Flow data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [endDate]);

  const handleExportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = (await import("file-saver"));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Arus Kas");

    worksheet.columns = [
      { header: isEnglish ? "Description" : "Keterangan", key: "desc", width: 50 },
      { header: isEnglish ? "Amount" : "Jumlah", key: "amount", width: 20 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "STATEMENT OF CASH FLOWS" : "LAPORAN ARUS KAS"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "Period" : "Periode"}: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`]);
    worksheet.addRow([]);

    worksheet.addRow([isEnglish ? "Cash Flows from Operating Activities" : "Arus Kas dari Aktivitas Operasi", getFlowTotal(flows.operating)]).getCell(2).numFmt = "#,##0.00";
    worksheet.addRow([isEnglish ? "Cash Flows from Investing Activities" : "Arus Kas dari Aktivitas Investasi", getFlowTotal(flows.investing)]).getCell(2).numFmt = "#,##0.00";
    worksheet.addRow([isEnglish ? "Cash Flows from Financing Activities" : "Arus Kas dari Aktivitas Pendanaan", getFlowTotal(flows.financing)]).getCell(2).numFmt = "#,##0.00";
    worksheet.addRow([]);
    const netRow = worksheet.addRow([isEnglish ? "Net Increase (Decrease) in Cash" : "Kenaikan (Penurunan) Bersih Kas", getFlowTotal(cashTrans)]);
    netRow.font = { bold: true };
    netRow.getCell(2).numFmt = "#,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ArusKas_${format(endDate, 'yyyyMMdd')}.xlsx`);
  };

  const flows = {
    operating: transactions.filter(t => (t.accountCode.startsWith('4') || t.accountCode.startsWith('5') || t.accountCode.startsWith('6') || t.accountCode.startsWith('7')) && new Date(t.date) >= startDate && new Date(t.date) <= endDate),
    investing: transactions.filter(t => (t.accountCode.startsWith('1-3') || t.accountCode.startsWith('1-4')) && new Date(t.date) >= startDate && new Date(t.date) <= endDate),
    financing: transactions.filter(t => (t.accountCode.startsWith('2') || t.accountCode.startsWith('3')) && new Date(t.date) >= startDate && new Date(t.date) <= endDate),
  };

  const cashAccounts = coa.filter(a => a.name.toLowerCase().includes("kas") || a.name.toLowerCase().includes("bank")).map(a => a.code);
  const cashTrans = transactions.filter(t => cashAccounts.includes(t.accountCode) && new Date(t.date) >= startDate && new Date(t.date) <= endDate);
  
  const getFlowTotal = (trans: any[]) => trans.reduce((s, t) => s + (t.debit - t.credit), 0);

  const Section = ({ titleEn, titleId, total }: any) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-200 text-left">
       <div className="flex flex-col">
          <span className="text-sm font-black uppercase text-slate-900">{titleEn}</span>
          <span className="text-[10px] italic text-slate-500 uppercase">{titleId}</span>
       </div>
       <span className="font-black text-slate-900">{formatCurrency(total)}</span>
    </div>
  );

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

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
               <div className="flex flex-col text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Dari</label>
                  <DatePicker 
                    selected={startDate} 
                    onChange={(date) => setStartDate(date || new Date())} 
                    dateFormat="dd/MM/yyyy"
                    className="bg-transparent outline-none text-sm font-bold text-slate-700 w-24"
                  />
               </div>
               <span className="text-slate-300 font-black px-2">/</span>
               <div className="flex flex-col text-left">
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
                <p className="text-slate-900 font-black text-lg">Menganalisis Arus Kas...</p>
                <p className="text-slate-400 text-sm font-medium">Sistem sedang mengklasifikasikan transaksi.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-16 shadow-xl border border-slate-200 rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
             <div className="text-center space-y-1 mb-12">
                <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
                <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
                <div className="pt-8 border-b-4 border-slate-900 pb-4">
                   <h2 className="text-xl font-black uppercase">{isEnglish ? "Statement of Cash Flows" : "Laporan Arus Kas"}</h2>
                   <p className="text-sm italic text-slate-500 uppercase">{isEnglish ? "Cash Flow Statement" : "Statement of Cash Flows"}</p>
                   <p className="mt-4 font-bold text-sm bg-slate-900 text-white inline-block px-6 py-1 rounded-full italic tracking-widest uppercase">
                     {isEnglish ? "Period" : "Periode"}: {format(startDate, "dd/MM/yyyy")} — {format(endDate, "dd/MM/yyyy")}
                   </p>
                </div>
             </div>

             <div className="space-y-4">
                <Section titleEn="Cash Flows from Operating Activities" titleId="Arus Kas dari Aktivitas Operasi" total={getFlowTotal(flows.operating)} />
                <Section titleEn="Cash Flows from Investing Activities" titleId="Arus Kas dari Aktivitas Investasi" total={getFlowTotal(flows.investing)} />
                <Section titleEn="Cash Flows from Financing Activities" titleId="Arus Kas dari Aktivitas Pendanaan" total={getFlowTotal(flows.financing)} />
                
                <div className="pt-8">
                   <div className="flex justify-between items-center py-6 bg-slate-900 text-white px-8 rounded-xl font-black uppercase text-xl shadow-lg">
                      <div className="flex flex-col text-left">
                        <span>{isEnglish ? "Net Increase (Decrease) in Cash" : "Net Increase (Decrease) in Cash"}</span>
                        <span className="text-xs italic text-blue-300 font-bold uppercase">{isEnglish ? "FOR THE PERIOD" : "Kenaikan (Penurunan) Bersih Kas"}</span>
                      </div>
                      <span>{formatCurrency(getFlowTotal(cashTrans))}</span>
                   </div>
                </div>
             </div>
          </div>
        )}
        <style jsx global>{`
          @media print { .no-print { display: none !important; } }
        `}</style>
      </div>
    </div>
  );
}
