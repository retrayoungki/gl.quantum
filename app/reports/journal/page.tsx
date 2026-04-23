"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyInfo } from "@/lib/dataService";
import { getAllTransactions, formatCurrency } from "@/lib/reportUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function JournalReport() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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

        const allTrans = await getAllTransactions();
        const filtered = allTrans.filter(t => 
          new Date(t.date) >= startDate && 
          new Date(t.date) <= endDate
        );
        setTransactions(filtered);
      } catch (error) {
        console.error("Error loading Journal data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [startDate, endDate]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Jurnal");

    worksheet.columns = [
      { header: isEnglish ? "Date" : "Tanggal", key: "date", width: 15 },
      { header: isEnglish ? "Ref No" : "No. Bukti", key: "code", width: 15 },
      { header: isEnglish ? "Account" : "Akun", key: "account", width: 30 },
      { header: isEnglish ? "Description" : "Keterangan", key: "description", width: 40 },
      { header: isEnglish ? "Debit" : "Debet", key: "debit", width: 15 },
      { header: isEnglish ? "Credit" : "Kredit", key: "credit", width: 15 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "GENERAL JOURNAL" : "JURNAL UMUM"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "Period" : "Periode"}: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`]);
    worksheet.addRow([]);

    transactions.forEach(t => {
      worksheet.addRow({
        date: format(new Date(t.date), "dd/MM/yyyy"),
        code: t.code,
        account: `${t.accountCode} - ${t.accountName}`,
        description: t.description,
        debit: t.debit,
        credit: t.credit,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Jurnal_${format(endDate, 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-left">
      <div className="max-w-6xl mx-auto space-y-6">
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
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <div>
                <p className="text-slate-900 font-black text-lg">Memuat Jurnal Transaksi...</p>
                <p className="text-slate-400 text-sm font-medium">Sistem sedang memproses data.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-12 shadow-xl border border-slate-200 min-h-[11in] animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="text-center space-y-1 mb-8">
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
              <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
              <div className="pt-4">
                <h2 className="text-lg font-black border-b-2 border-slate-900 inline-block px-8 uppercase">{isEnglish ? "General Journal" : "Jurnal Umum"}</h2>
                <p className="text-sm mt-1 font-bold bg-slate-100 inline-block px-4 py-1 rounded-full text-slate-700 uppercase tracking-widest">{format(startDate, "dd/MM/yyyy")} — {format(endDate, "dd/MM/yyyy")}</p>
              </div>
            </div>

            <table className="w-full text-xs">
               <thead className="border-y-2 border-slate-900">
                  <tr>
                     <th className="py-2 text-left">{isEnglish ? "Date" : "Tanggal"}</th>
                     <th className="py-2 text-left">{isEnglish ? "Ref No / Description" : "No. Bukti / Keterangan"}</th>
                     <th className="py-2 text-left">{isEnglish ? "Account" : "Akun"}</th>
                     <th className="py-2 text-right">{isEnglish ? "Debit" : "Debet"}</th>
                     <th className="py-2 text-right">{isEnglish ? "Credit" : "Kredit"}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium italic">Tidak ada transaksi dalam periode ini</td></tr>
                  ) : (
                    transactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="py-3 align-top font-medium text-slate-600 text-left">{format(new Date(t.date), "dd/MM/yyyy")}</td>
                         <td className="py-3 align-top text-left">
                            <p className="font-bold text-slate-900">{t.code}</p>
                            <p className="text-slate-500 italic max-w-[200px] truncate">{t.description}</p>
                         </td>
                         <td className="py-3 align-top text-left">
                            <p className="font-bold text-blue-700">{t.accountCode}</p>
                            <p className="text-slate-600">{t.accountName}</p>
                         </td>
                         <td className="py-3 align-top text-right font-bold text-slate-900">{t.debit > 0 ? formatCurrency(t.debit) : "-"}</td>
                         <td className="py-3 align-top text-right font-bold text-slate-900">{t.credit > 0 ? formatCurrency(t.credit) : "-"}</td>
                      </tr>
                    ))
                  )}
               </tbody>
               <tfoot className="border-t-2 border-slate-900 font-black bg-slate-50">
                  <tr>
                     <td colSpan={3} className="py-3 text-right uppercase tracking-wider pr-4">Total</td>
                     <td className="py-3 text-right border-x border-slate-200">{formatCurrency(transactions.reduce((s, t) => s + t.debit, 0))}</td>
                     <td className="py-3 text-right">{formatCurrency(transactions.reduce((s, t) => s + t.credit, 0))}</td>
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
