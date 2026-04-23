"use client";

import { useState, useEffect } from "react";

import { getCOAData, updateCOAData, getCompanyInfo } from "@/lib/dataService";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Account {
  code: string;
  name: string;
  type: string;
  level: string;
  normalBalance: "Debit" | "Kredit";
  saldo: number;
}

export default function BeginningBalance() {
  const [coaData, setCoaData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = (await getCOAData()) as any;
      if (data && data.accounts) {
        setCoaData(data.accounts);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaldoChange = (code: string, value: string) => {
    const numValue = parseFloat(value) || 0;

    const newData = coaData.map((acc) => {
      if (acc.code === code) {
        return { ...acc, saldo: value === "" || value === "-" ? (value as any) : numValue };
      }
      return acc;
    });
    setCoaData(newData);
  };

  const handleSave = async () => {
    setSaveStatus("Menyimpan...");
    // Fix any string placeholders (like "-") before saving
    const cleanedData = coaData.map(acc => ({
      ...acc,
      saldo: typeof acc.saldo === 'number' ? acc.saldo : (parseFloat(acc.saldo as any) || 0)
    }));
    const res = await updateCOAData(cleanedData);
    if (res.success) {
      setCoaData(cleanedData);
      setSaveStatus("Berhasil disimpan ✅");
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus("Gagal menyimpan ❌");
    }
  };

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return "0";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Only display Balance Sheet accounts (Group 1, 2, 3)
  const displayedAccounts = coaData.filter(acc => {
    const prefix = acc.code.charAt(0);
    return prefix === '1' || prefix === '2' || prefix === '3';
  });

  // Calculate totals
  let totalDebit = 0;
  let totalKredit = 0;

  displayedAccounts.forEach((acc) => {
    if (acc.level === "Rincian Akun") {
      const val = typeof acc.saldo === 'number' ? acc.saldo : (parseFloat(acc.saldo as any) || 0);
      if (acc.normalBalance === "Debit") {
        totalDebit += val;
      } else {
        totalKredit += val;
      }
    }
  });

  const selisih = Math.abs(totalDebit - totalKredit);
  const isBalanced = selisih === 0;

  const handleExportExcel = async () => {
    try {
      setSaveStatus("Preparing Export...");
      const companyData = (await getCompanyInfo()) as any;
      const companyName = companyData?.profile?.name || "[NAMA PERUSAHAAN]";
      const address = companyData?.profile?.address || "[ALAMAT PERUSAHAAN]";
      const city = companyData?.profile?.city || "";
      const fullAddress = `${address}${city ? ", " + city : ""}`;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Saldo Awal");

      // Headers
      worksheet.mergeCells("A1:C1");
      worksheet.getCell("A1").value = companyName;
      worksheet.getCell("A1").font = { bold: true, size: 14 };

      worksheet.mergeCells("A2:C2");
      worksheet.getCell("A2").value = fullAddress;

      worksheet.mergeCells("A4:C4");
      worksheet.getCell("A4").value = "Laporan Saldo Awal";
      worksheet.getCell("A4").font = { bold: true, size: 12 };

      const headerRow = worksheet.getRow(6);
      headerRow.values = ["No Akun", "Nama Akun", "Saldo Awal"];
      headerRow.font = { bold: true };

      displayedAccounts.forEach((acc) => {
        const val = typeof acc.saldo === 'number' ? acc.saldo : (parseFloat(acc.saldo as any) || 0);
        const row = worksheet.addRow([acc.code, acc.name, val]);
        if (acc.level !== "Rincian Akun") {
          row.font = { bold: true };
          row.getCell(3).value = ""; // Don't show balance for master accounts in excel
        } else {
          row.getCell(3).numFmt = '#,##0';
        }
      });

      // Footer
      worksheet.addRow([]);
      worksheet.addRow(["", "Total Debit", totalDebit]).font = { bold: true };
      worksheet.addRow(["", "Total Kredit", totalKredit]).font = { bold: true };
      const diffRow = worksheet.addRow(["", "Selisih", selisih]);
      diffRow.font = { bold: true, color: isBalanced ? { argb: 'FF00B050' } : { argb: 'FFFF0000' } };
      
      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 25;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Saldo_Awal_${companyName.replace(/\s+/g, "_")}.xlsx`);
      setSaveStatus("Export Successful! ✅");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("Export Error ❌");
    }
  };

  const handleExportPDF = async () => {
    try {
      setSaveStatus("Preparing PDF...");
      const companyData = (await getCompanyInfo()) as any;
      const companyName = companyData?.profile?.name || "[NAMA PERUSAHAAN]";

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(companyName, 14, 15);
      doc.setFontSize(10);
      doc.text("Laporan Saldo Awal", 14, 22);

      const tableData = displayedAccounts.map((acc) => {
        const val = typeof acc.saldo === 'number' ? acc.saldo : (parseFloat(acc.saldo as any) || 0);
        return [
          acc.code,
          acc.name,
          acc.level === "Rincian Akun" ? formatCurrency(val) : "",
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [["No Akun", "Nama Akun", "Saldo Awal"]],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 8 },
        columnStyles: { 2: { halign: "right" } },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 30;
      doc.setFont("helvetica", "bold");
      doc.text(`Total Debit: Rp. ${formatCurrency(totalDebit)}`, 14, finalY + 10);
      doc.text(`Total Kredit: Rp. ${formatCurrency(totalKredit)}`, 14, finalY + 16);
      doc.setTextColor(isBalanced ? 0 : 255, 0, 0); // Black if balanced, Red if not
      if (isBalanced) {
        doc.setTextColor(34, 197, 94); // Green
      }
      doc.text(`Selisih: Rp. ${formatCurrency(selisih)}`, 14, finalY + 22);

      doc.save(`Saldo_Awal_${companyName.replace(/\s+/g, "_")}.pdf`);
      setSaveStatus("Export PDF Successful! ✅");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus("Export Error ❌");
    }
  };

  const getIndentClass = (level: string) => {
    switch (level) {
      case 'Master Akun': return 'pl-6';
      case 'Sub Akun': return 'pl-10';
      case 'Rincian Akun': return 'pl-16';
      default: return 'pl-4';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">


      <main className="p-8 max-w-7xl mx-auto space-y-6 pb-32">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
                Saldo Awal Account
              </h1>
            </div>
            <p className="text-slate-500 font-medium mt-2 ml-12">
              Setup saldo awal pembukuan sesuai standar akuntansi (PSAK).
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">table_view</span>
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Export PDF
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Simpan Data
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            saveStatus.includes('Error') || saveStatus.includes('Gagal') ? 'bg-red-50 text-red-600 border border-red-100' : 
            'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            <span className="material-symbols-outlined">
              {saveStatus.includes('Error') || saveStatus.includes('Gagal') ? 'error' : 'info'}
            </span>
            {saveStatus}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-40">No Akun</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest">Nama Akun</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-64 text-right">Saldo Awal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">Memuat data...</td>
                  </tr>
                ) : (
                  displayedAccounts.map((acc) => (
                    <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className={`px-6 py-3 text-sm font-bold ${acc.level === 'Master' || acc.level === 'Master Akun' ? 'text-blue-600' : 'text-slate-500'}`}>
                        {acc.code}
                      </td>
                      <td className={`px-6 py-3 ${getIndentClass(acc.level)}`}>
                        <div className="flex items-center gap-3">
                          {acc.level !== 'Master' && acc.level !== 'Master Akun' && (
                            <span className="material-symbols-outlined text-slate-300 text-sm">subdirectory_arrow_right</span>
                          )}
                          <span className={`text-sm ${
                            acc.level === 'Master' || acc.level === 'Master Akun' || acc.level === 'Sub Akun'
                              ? 'font-extrabold text-slate-900 uppercase tracking-tight' 
                              : 'font-semibold text-slate-600'
                          }`}>
                            {acc.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-right">
                        {acc.level === "Rincian Akun" ? (
                          <input
                            type="number"
                            value={acc.saldo === 0 ? "" : acc.saldo}
                            onChange={(e) => handleSaldoChange(acc.code, e.target.value)}
                            placeholder="0"
                            className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        ) : (
                          <span className="text-slate-400 font-medium text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Floating Footer for Totals */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-4 px-8 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Debit</p>
              <p className="text-xl font-extrabold text-slate-900">Rp. {formatCurrency(totalDebit)}</p>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Kredit</p>
              <p className="text-xl font-extrabold text-slate-900">Rp. {formatCurrency(totalKredit)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Selisih</p>
            <div className={`flex items-center gap-2 justify-end ${isBalanced ? 'text-emerald-500' : 'text-red-500'}`}>
              <span className="material-symbols-outlined">
                {isBalanced ? 'check_circle' : 'error'}
              </span>
              <p className="text-2xl font-extrabold">
                Rp. {formatCurrency(selisih)}
              </p>
            </div>
            {!isBalanced && (
              <p className="text-xs font-bold text-red-500 mt-1">Harus bernilai 0 (Balanced)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
