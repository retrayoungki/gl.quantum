"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyInfo, getCOAData } from "@/lib/dataService";
import { getAllTransactions, formatCurrency } from "@/lib/reportUtils";
import { t } from "@/lib/translations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function GeneralLedgerReport() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [coa, setCoa] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Company Info first
        const info = await getCompanyInfo();
        if (info) setCompanyInfo(info);

        const [allTrans, coaData] = await Promise.all([
          getAllTransactions(),
          getCOAData()
        ]);
        setTransactions(allTrans);
        const detailAccounts = coaData?.accounts?.filter((a: any) => a.level === "Rincian Akun") || [];
        setCoa(detailAccounts);
        if (detailAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(detailAccounts[0].code);
        }
      } catch (error) {
        console.error("Error loading General Ledger data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getFilteredTransactions = () => {
    if (!selectedAccount || transactions.length === 0) return [];
    
    const account = coa.find(a => a.code === selectedAccount);
    const isDebitNormal = account?.normalBalance === "Debit";

    const initialTrans = transactions.filter(t => 
      t.accountCode === selectedAccount && 
      new Date(t.date) < startDate
    );
    const initialDebit = initialTrans.reduce((s, t) => s + t.debit, 0);
    const initialCredit = initialTrans.reduce((s, t) => s + t.credit, 0);
    const initialBalance = isDebitNormal ? (initialDebit - initialCredit) : (initialCredit - initialDebit);

    const periodTrans = transactions.filter(t => 
      t.accountCode === selectedAccount && 
      new Date(t.date) >= startDate && 
      new Date(t.date) <= endDate
    );

    let currentBalance = initialBalance;
    return [
      { date: format(startDate, 'yyyy-MM-dd'), description: isEnglish ? "OPENING BALANCE" : "SALDO AWAL", debit: 0, credit: 0, balance: initialBalance, isInitial: true },
      ...periodTrans.map(t => {
        currentBalance += isDebitNormal ? (t.debit - t.credit) : (t.credit - t.debit);
        return { ...t, balance: currentBalance };
      })
    ];
  };

  const ledgerData = getFilteredTransactions();

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Buku Besar");
    const account = coa.find(a => a.code === selectedAccount);

    worksheet.columns = [
      { header: isEnglish ? "Date" : "Tanggal", key: "date", width: 15 },
      { header: isEnglish ? "Description" : "Keterangan", key: "description", width: 40 },
      { header: isEnglish ? "Ref" : "Ref", key: "code", width: 15 },
      { header: isEnglish ? "Debit" : "Debet", key: "debit", width: 15 },
      { header: isEnglish ? "Credit" : "Kredit", key: "credit", width: 15 },
      { header: isEnglish ? "Balance" : "Saldo", key: "balance", width: 15 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "GENERAL LEDGER" : "BUKU BESAR"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "Period" : "Periode"}: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`]);
    worksheet.addRow([`${isEnglish ? "Account" : "Akun"}: ${selectedAccount} - ${account?.name}`]);
    worksheet.addRow([]);

    ledgerData.forEach(t => {
      worksheet.addRow({
        date: format(new Date(t.date), "dd/MM/yyyy"),
        description: t.description,
        code: t.code || "",
        debit: t.debit || 0,
        credit: t.credit || 0,
        balance: t.balance || 0,
      }).getCell(4).numFmt = "#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `BukuBesar_${selectedAccount}_${format(endDate, 'yyyyMMdd')}.xlsx`);
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

            <select 
              value={selectedAccount} 
              onChange={e => setSelectedAccount(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-blue-700 bg-slate-50 max-w-xs"
            >
              {coa.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {t(acc.name, isEnglish)}</option>)}
            </select>
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
                <p className="text-slate-900 font-black text-lg">Menyiapkan Buku Besar...</p>
                <p className="text-slate-400 text-sm font-medium">Data sedang dikonsolidasi.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-12 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1 mb-8">
               <h1 className="text-xl font-black uppercase tracking-tight">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
               <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
               <div className="pt-4 border-b-2 border-slate-900 pb-4">
                  <h2 className="text-lg font-black uppercase">{isEnglish ? "General Ledger" : "Buku Besar"}</h2>
                  <p className="text-xs italic text-slate-500 uppercase">{isEnglish ? "Statement of Accounts" : "General Ledger"}</p>
                  <div className="mt-4 flex flex-col items-center gap-1">
                     <p className="text-sm font-bold bg-blue-50 text-blue-700 px-6 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                        {isEnglish ? "Account" : "Akun"}: {selectedAccount} - {t(coa.find(a => a.code === selectedAccount)?.name || "", isEnglish)}
                     </p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {isEnglish ? "Period" : "Periode"}: {format(startDate, "dd/MM/yyyy")} — {format(endDate, "dd/MM/yyyy")}
                     </p>
                  </div>
               </div>
            </div>

            <table className="w-full text-xs">
               <thead className="bg-slate-900 text-white">
                  <tr>
                     <th className="py-3 px-4 text-left rounded-tl">{isEnglish ? "Date" : "Tanggal"}</th>
                     <th className="py-3 px-4 text-left">{isEnglish ? "Description" : "Keterangan"}</th>
                     <th className="py-3 px-4 text-left">{isEnglish ? "Ref" : "Ref"}</th>
                     <th className="py-3 px-4 text-right">{isEnglish ? "Debit" : "Debet"}</th>
                     <th className="py-3 px-4 text-right">{isEnglish ? "Credit" : "Kredit"}</th>
                     <th className="py-3 px-4 text-right rounded-tr">{isEnglish ? "Balance" : "Saldo"}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {ledgerData.map((t, i) => (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${t.isInitial ? "bg-slate-50/50 font-bold" : ""}`}>
                       <td className="py-2 px-4 text-slate-500 text-left">{format(new Date(t.date), "dd/MM/yyyy")}</td>
                       <td className="py-2 px-4 font-medium text-slate-700 text-left">{t.description}</td>
                       <td className="py-2 px-4 font-mono text-blue-600 text-left">{t.code || ""}</td>
                       <td className="py-2 px-4 text-right text-slate-900">{t.debit > 0 ? formatCurrency(t.debit) : "-"}</td>
                       <td className="py-2 px-4 text-right text-slate-900">{t.credit > 0 ? formatCurrency(t.credit) : "-"}</td>
                       <td className="py-2 px-4 text-right font-black text-slate-900">{formatCurrency(t.balance)}</td>
                    </tr>
                  ))}
               </tbody>
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
