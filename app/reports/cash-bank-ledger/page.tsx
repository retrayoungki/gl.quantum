"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getCompanyInfo, getCOAData } from "@/lib/dataService";
import { getAllTransactions, formatCurrency } from "@/lib/reportUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CashBankLedgerReport() {
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
        const info = await getCompanyInfo();
        if (info) setCompanyInfo(info);

        const [allTrans, coaData] = await Promise.all([
          getAllTransactions(),
          getCOAData()
        ]);
        setTransactions(allTrans);
        const cashBankAccounts = coaData?.accounts?.filter((a: any) => 
          a.level === "Rincian Akun" && 
          (a.name.toLowerCase().includes("kas") || a.name.toLowerCase().includes("bank"))
        ) || [];
        setCoa(cashBankAccounts);
        if (cashBankAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(cashBankAccounts[0].code);
        }
      } catch (error) {
        console.error("Error loading Cash/Bank Ledger data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedAccount]);

  const getFilteredTransactions = () => {
    if (!selectedAccount || transactions.length === 0) return [];
    
    const initialTrans = transactions.filter(t => 
      t.accountCode === selectedAccount && 
      new Date(t.date) < startDate
    );
    const initialDebit = initialTrans.reduce((s, t) => s + t.debit, 0);
    const initialCredit = initialTrans.reduce((s, t) => s + t.credit, 0);
    const initialBalance = initialDebit - initialCredit;

    const periodTrans = transactions.filter(t => 
      t.accountCode === selectedAccount && 
      new Date(t.date) >= startDate && 
      new Date(t.date) <= endDate
    );

    let currentBalance = initialBalance;
    return [
      { date: format(startDate, 'yyyy-MM-dd'), description: isEnglish ? "OPENING BALANCE" : "SALDO AWAL", debit: 0, credit: 0, balance: initialBalance, isInitial: true },
      ...periodTrans.map(t => {
        currentBalance += (t.debit - t.credit);
        return { ...t, balance: currentBalance };
      })
    ];
  };

  const ledgerData = getFilteredTransactions();

  const handleExportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = (await import("file-saver"));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Buku Kas Bank");
    const account = coa.find(a => a.code === selectedAccount);

    worksheet.columns = [
      { header: isEnglish ? "Date" : "Tanggal", key: "date", width: 15 },
      { header: isEnglish ? "Ref No" : "No. Voucher", key: "code", width: 15 },
      { header: isEnglish ? "Description" : "Keterangan", key: "description", width: 40 },
      { header: isEnglish ? "Debit" : "Debet", key: "debit", width: 15 },
      { header: isEnglish ? "Credit" : "Kredit", key: "credit", width: 15 },
      { header: isEnglish ? "Balance" : "Saldo", key: "balance", width: 15 },
    ];

    worksheet.addRow([companyInfo?.profile?.name || "PT QUANTUM GL"]).font = { bold: true, size: 14 };
    worksheet.addRow([companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"]);
    worksheet.addRow([isEnglish ? "CASH AND BANK LEDGER" : "BUKU KAS DAN BANK"]).font = { bold: true };
    worksheet.addRow([`${isEnglish ? "Period" : "Periode"}: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`]);
    worksheet.addRow([`${isEnglish ? "Account" : "Akun"}: ${selectedAccount} - ${account?.name}`]);
    worksheet.addRow([]);

    ledgerData.forEach(t => {
      worksheet.addRow({
        date: format(new Date(t.date), "dd/MM/yyyy"),
        code: t.code || "",
        description: t.description,
        debit: t.debit || 0,
        credit: t.credit || 0,
        balance: t.balance || 0,
      }).getCell(4).numFmt = "#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `BukuKasBank_${selectedAccount}_${format(endDate, 'yyyyMMdd')}.xlsx`);
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
              {coa.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>)}
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
                <p className="text-slate-900 font-black text-lg">Menyiapkan Buku Kas/Bank...</p>
                <p className="text-slate-400 text-sm font-medium">Memproses transaksi kas.</p>
             </div>
          </div>
        ) : (
          <div className="bg-white p-12 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1 mb-8">
               <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">{companyInfo?.profile?.name || "PT QUANTUM GL"}</h1>
               <p className="text-sm font-bold text-slate-500 uppercase">{companyInfo?.profile?.address || "Jl. Raya Accounting No. 1"}</p>
               <div className="pt-6 border-b-2 border-slate-900 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">{isEnglish ? "Cash and Bank Ledger" : "Buku Kas / Bank"}</h2>
                  <div className="mt-4 flex flex-col items-center gap-1">
                     <p className="text-sm font-bold bg-blue-50 text-blue-700 px-6 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                        {isEnglish ? "Account" : "Buku"}: {coa.find(a => a.code === selectedAccount)?.name}
                     </p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {isEnglish ? "Period" : "Periode"}: {format(startDate, "dd/MM/yyyy")} — {format(endDate, "dd/MM/yyyy")}
                     </p>
                  </div>
               </div>
            </div>

            <table className="w-full text-[11px] border-collapse">
               <thead className="border-y-2 border-slate-900">
                  <tr>
                     <th className="py-2 px-2 text-left border-r border-slate-200">{isEnglish ? "Date" : "Tanggal"}</th>
                     <th className="py-2 px-2 text-left border-r border-slate-200">{isEnglish ? "Ref No" : "No. Voucher"}</th>
                     <th className="py-2 px-2 text-left border-r border-slate-200">{isEnglish ? "Description" : "Keterangan"}</th>
                     <th className="py-2 px-2 text-right border-r border-slate-200">{isEnglish ? "Debit" : "Debet"}</th>
                     <th className="py-2 px-2 text-right border-r border-slate-200">{isEnglish ? "Credit" : "Kredit"}</th>
                     <th className="py-2 px-2 text-right">{isEnglish ? "Balance" : "Saldo"}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 border-b-2 border-slate-900">
                  {ledgerData.map((t, i) => (
                    <tr key={i} className={t.isInitial ? "bg-slate-50 font-bold" : "hover:bg-slate-50/50 transition-colors"}>
                       <td className="py-2 px-2 border-r border-slate-200 text-slate-500 text-left">{format(new Date(t.date), "dd/MM/yyyy")}</td>
                       <td className="py-2 px-2 border-r border-slate-200 font-bold text-blue-900 text-left">{t.code || ""}</td>
                       <td className="py-2 px-2 border-r border-slate-200 text-slate-600 italic text-left">{t.description}</td>
                       <td className="py-2 px-2 border-r border-slate-200 text-right">{t.debit > 0 ? formatCurrency(t.debit) : "0,00"}</td>
                       <td className="py-2 px-2 border-r border-slate-200 text-right">{t.credit > 0 ? formatCurrency(t.credit) : "0,00"}</td>
                       <td className="py-2 px-2 text-right font-black text-slate-900">{formatCurrency(t.balance)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
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
