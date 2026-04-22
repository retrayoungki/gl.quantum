"use client";

import { useState, useEffect } from "react";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCompanyInfo } from "@/lib/dataService";

export default function ProfitLossReport() {
  const [companyInfo, setCompanyInfo] = useState({
    name: "[NAMA PERUSAHAAN]",
    address1: "[ALAMAT PERUSAHAAN]",
    address2: "[KOTA / KETERANGAN]"
  });
  const printDate = "14/04/2026";
  const period = "01/01/2026 s/d 31/12/2026";

  useEffect(() => {
    async function loadInfo() {
      const data = await getCompanyInfo() as any;
      if (data && data.profile) {
        setCompanyInfo({
          name: data.profile.name || "[NAMA PERUSAHAAN]",
          address1: data.profile.address || "[ALAMAT PERUSAHAAN]",
          address2: data.profile.city || "[KOTA / KETERANGAN]"
        });
      }
    }
    loadInfo();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const AccountRow = ({ code, name, value = 0 }: { code: string; name: string; value?: number }) => (
    <div className="flex justify-between items-baseline">
      <div className="flex gap-12">
        <span className="w-24 inline-block">{code}</span>
        <span>{name}</span>
      </div>
      <span>{formatNumber(value)}</span>
    </div>
  );

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laba Rugi");

    // Columns setup
    worksheet.columns = [
      { key: "code", width: 15 },
      { key: "name", width: 45 },
      { key: "amount", width: 20 },
    ];

    // Header Rows
    const headerRows = [
      [companyInfo.name],
      [companyInfo.address1],
      [companyInfo.address2],
      [],
      ["LAPORAN LABA / RUGI"],
      [period],
      [],
      [`Dicetak tanggal : ${printDate}`],
      [],
    ];

    headerRows.forEach((row, i) => {
      const addedRow = worksheet.addRow(row);
      if (i < 6 && row[0]) {
        addedRow.getCell(1).font = { bold: true };
        addedRow.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(addedRow.number, 1, addedRow.number, 3);
      }
    });

    const dataRows = [
      { type: 'line', content: ["----------------------------------------------------------------------------------------------------"] },
      { type: 'section', content: ["Penjualan"] },
      { type: 'item', content: ["4-00001", "Sales", 0] },
      { type: 'total', content: ["", "Total Penjualan", 0] },
      { type: 'empty' },
      { type: 'section', content: ["HPP"] },
      { type: 'total', content: ["", "Total HPP", 0] },
      { type: 'result', content: ["", "LABA KOTOR", 0] },
      { type: 'empty' },
      { type: 'section', content: ["Biaya Penjualan"] },
      { type: 'total', content: ["", "Total Biaya Penjualan", 0] },
      { type: 'empty' },
      { type: 'section', content: ["Biaya Adm & Umum"] },
      { type: 'item', content: ["7-00001", "Salary Expense", 0] },
      { type: 'item', content: ["7-00002", "Rent Expense", 0] },
      { type: 'item', content: ["7-00004", "Tax Expense", 0] },
      { type: 'item', content: ["7-00005", "Electricity, Gas, Water, Telephone Expense", 0] },
      { type: 'item', content: ["7-00006", "Stamp Expense", 0] },
      { type: 'item', content: ["7-00007", "Consultant Expense", 0] },
      { type: 'item', content: ["7-00008", "Internet & Cloud Expense", 0] },
      { type: 'item', content: ["7-00009", "Notary Expense", 0] },
      { type: 'item', content: ["7-00010", "Food & Drink Cost", 0] },
      { type: 'item', content: ["7-00011", "VAT Charges", 0] },
      { type: 'item', content: ["7-00013", "Depreciation Expense", 0] },
      { type: 'item', content: ["7-00015", "Application Rent Expense", 0] },
      { type: 'item', content: ["7-00019", "Insurance Expense", 0] },
      { type: 'item', content: ["7-00020", "Transportation Expense", 0] },
      { type: 'item', content: ["7-00021", "Sinking Fund Expense", 0] },
      { type: 'item', content: ["7-00023", "Service Charge", 0] },
      { type: 'total', content: ["", "Total biaya Adm & Umum", 0] },
      { type: 'total', content: ["", "BIAYA OPERASIONAL", 0] },
      { type: 'result', content: ["", "LABA BERSIH USAHA", 0] },
      { type: 'empty' },
      { type: 'section', content: ["Pendapatan di Luar Usaha"] },
      { type: 'item', content: ["8-00001", "Giro Service Income", 0] },
      { type: 'item', content: ["8-00002", "Other Income", 0] },
      { type: 'total', content: ["", "Total Pendapatan Diluar Usaha", 0] },
      { type: 'empty' },
      { type: 'section', content: ["Biaya di Luar Usaha"] },
      { type: 'item', content: ["9-00001", "Bank Admin Fees", 0] },
      { type: 'item', content: ["9-00002", "Current Account Service Tax", 0] },
      { type: 'item', content: ["9-00003", "Loss on Exchange Rate", 0] },
      { type: 'total', content: ["", "Total biaya Diluar Usaha", 0] },
      { type: 'total', content: ["", "Laba Lain-lain", 0] },
      { type: 'total', content: ["", "Laba Bersih lain", 0] },
      { type: 'final', content: ["", "RUGI / LABA", 0] },
    ];

    dataRows.forEach(data => {
      if (data.type === 'empty') {
        worksheet.addRow([]);
        return;
      }
      const addedRow = worksheet.addRow(data.content);
      const cellC = addedRow.getCell(3);
      
      // Formatting Column C
      if (typeof data.content?.[2] === 'number') {
        cellC.numFmt = '#,##0';
      }

      // Styling based on type
      if (data.type === 'section') {
        addedRow.getCell(1).font = { bold: true };
      }
      if (data.type === 'total' || data.type === 'result' || data.type === 'final') {
        addedRow.getCell(2).font = { bold: true };
        cellC.font = { bold: true };
      }
      if (data.type === 'final') {
        addedRow.eachCell(cell => {
          cell.font = { bold: true, size: 12 };
          cell.border = { top: { style: 'double' } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Laba_Rugi_${companyInfo.name.replace(/\s+/g, '_')}_${printDate.replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-white">


      <main className="p-8 max-w-4xl mx-auto">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8 no-print">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
            >
              <span className="material-symbols-outlined">download</span>
              Export to Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined">print</span>
              Print Report
            </button>
          </div>
        </div>

        {/* Report Document */}
        <div className="bg-white p-12 border border-slate-200 shadow-sm rounded-sm text-[#000000]">
          {/* Header */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="text-xl font-bold uppercase">{companyInfo.name}</h1>
            <p className="text-sm font-bold uppercase">{companyInfo.address1}</p>
            <p className="text-sm font-bold uppercase">{companyInfo.address2}</p>
            <div className="pt-4">
              <h2 className="text-lg font-bold border-b-2 border-black inline-block px-4 uppercase">Laporan Laba / Rugi</h2>
              <p className="text-sm mt-1">{period}</p>
            </div>
          </div>

          <div className="text-sm mb-4">
            <p>Dicetak tanggal : {printDate}</p>
          </div>

          {/* Table Container */}
          <div className="border-t-2 border-black pt-2 space-y-6">
            
            {/* Penjualan Section */}
            <div>
              <h3 className="font-bold">Penjualan</h3>
              <div className="pl-2">
                <AccountRow code="4-00001" name="Sales" value={0} />
              </div>
              <div className="flex justify-between font-bold border-t border-black mt-1">
                <span className="pl-40">Total Penjualan</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

            {/* HPP Section */}
            <div>
              <h3 className="font-bold">HPP</h3>
              <div className="flex justify-between font-bold border-t border-black mt-1">
                <span className="pl-40">Total HPP</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black mt-1 bg-slate-50/50">
                <span className="pl-40 uppercase">LABA KOTOR</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

            {/* Biaya Penjualan Section */}
            <div>
              <h3 className="font-bold">Biaya Penjualan</h3>
              <div className="flex justify-between font-bold border-t border-black mt-1">
                <span className="pl-40">Total Biaya Penjualan</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

            {/* Biaya Adm & Umum Section */}
            <div>
              <h3 className="font-bold">Biaya Adm & Umum</h3>
              <div className="space-y-0.5 pl-2">
                <AccountRow code="7-00001" name="Salary Expense" value={0} />
                <AccountRow code="7-00002" name="Rent Expense" value={0} />
                <AccountRow code="7-00004" name="Tax Expense" value={0} />
                <AccountRow code="7-00005" name="Electricity, Gas, Water, Telephone Expense" value={0} />
                <AccountRow code="7-00006" name="Stamp Expense" value={0} />
                <AccountRow code="7-00007" name="Consultant Expense" value={0} />
                <AccountRow code="7-00008" name="Internet & Cloud Expense" value={0} />
                <AccountRow code="7-00009" name="Notary Expense" value={0} />
                <AccountRow code="7-00010" name="Food & Drink Cost" value={0} />
                <AccountRow code="7-00011" name="VAT Charges" value={0} />
                <AccountRow code="7-00013" name="Depreciation Expense" value={0} />
                <AccountRow code="7-00015" name="Application Rent Expense" value={0} />
                <AccountRow code="7-00019" name="Insurance Expense" value={0} />
                <AccountRow code="7-00020" name="Transportation Expense" value={0} />
                <AccountRow code="7-00021" name="Sinking Fund Expense" value={0} />
                <AccountRow code="7-00023" name="Service Charge" value={0} />
              </div>
              <div className="flex justify-between font-bold border-t border-black mt-2">
                <span className="pl-40">Total biaya Adm & Umum</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black">
                <span className="pl-40 uppercase">BIAYA OPERASIONAL</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black bg-slate-50/50">
                <span className="pl-40 uppercase">LABA BERSIH USAHA</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

            {/* Pendapatan di Luar Usaha Section */}
            <div>
              <h3 className="font-bold">Pendapatan di Luar Usaha</h3>
              <div className="space-y-0.5 pl-2">
                <AccountRow code="8-00001" name="Giro Service Income" value={0} />
                <AccountRow code="8-00002" name="Other Income" value={0} />
              </div>
              <div className="flex justify-between font-bold border-t border-black mt-1">
                <span className="pl-40">Total Pendapatan Diluar Usaha</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

            {/* Biaya di Luar Usaha Section */}
            <div>
              <h3 className="font-bold">Biaya di Luar Usaha</h3>
              <div className="space-y-0.5 pl-2">
                <AccountRow code="9-00001" name="Bank Admin Fees" value={0} />
                <AccountRow code="9-00002" name="Current Account Service Tax" value={0} />
                <AccountRow code="9-00003" name="Loss on Exchange Rate" value={0} />
              </div>
              <div className="flex justify-between font-bold border-t border-black mt-1">
                <span className="pl-40">Total biaya Diluar Usaha</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black">
                <span className="pl-40 uppercase">Laba Lain-lain</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black">
                <span className="pl-40 uppercase">Laba Bersih lain</span>
                <span>{formatNumber(0)}</span>
              </div>
              <div className="flex justify-between font-extrabold border-t-2 border-black mt-2 bg-slate-50">
                <span className="pl-40 uppercase">RUGI / LABA</span>
                <span>{formatNumber(0)}</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            font-family: Calibri, 'Segoe UI', Candara, Segoe, Optima, Arial, sans-serif !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          .bg-white {
            border: none !important;
            box-shadow: none !important;
          }
          header {
            display: none !important;
          }
          * {
            font-family: Calibri, 'Segoe UI', Candara, Segoe, Optima, Arial, sans-serif !important;
          }
        }
      `}</style>
    </div>
  );
}
