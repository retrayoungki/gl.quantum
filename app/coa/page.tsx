"use client";

import { useState, useRef, useEffect } from "react";

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCOAData, updateCOAData, getCompanyInfo, getJournals, saveJournals, getVouchers, saveVouchers } from "@/lib/dataService";
import { getAccountBalances } from "@/lib/reportUtils";

interface Account {
  code: string;
  name: string;
  type: string;
  level: 'Master' | 'Master Akun' | 'Sub Akun' | 'Rincian Akun';
  normalBalance: 'Debit' | 'Kredit';
  saldo: number;
  accountNumber?: string;
}

const initialCoaData: Account[] = [
  // 1-xxxx: ASET
  { code: "1-0000", name: "ASET (HARTA)", type: "Aset", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1000", name: "ASET LANCAR", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1200", name: "KAS & SETARA KAS", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1201", name: "Kas Besar", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1202", name: "Kas Kecil (Petty Cash)", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1203", name: "Bank BCA", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0, accountNumber: "" },
  { code: "1-1204", name: "Bank Mandiri", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0, accountNumber: "" },
  { code: "1-1205", name: "Bank BNI", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0, accountNumber: "" },
  { code: "1-1300", name: "PIUTANG USAHA", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1301", name: "Piutang Dagang", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1302", name: "Cadangan Kerugian Piutang", type: "Aset", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "1-1400", name: "PERSEDIAAN", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1401", name: "Persediaan Barang Jadi", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1402", name: "Persediaan Barang Dalam Proses", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1403", name: "Persediaan Bahan Baku", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1500", name: "PAJAK DIBAYAR DI MUKA", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1501", name: "PPN Masukan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1502", name: "PPh 22 Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1503", name: "PPh 23 Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1504", name: "PPh 25 Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2000", name: "BIAYA DIBAYAR DI MUKA", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2001", name: "Sewa Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2002", name: "Asuransi Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3000", name: "ASET TETAP", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3100", name: "Tanah", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3200", name: "Bangunan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3201", name: "Akumulasi Penyusutan Bangunan", type: "Aset", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "1-3300", name: "Kendaraan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3301", name: "Akumulasi Penyusutan Kendaraan", type: "Aset", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "1-3400", name: "Peralatan Kantor", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3401", name: "Akumulasi Penyusutan Peralatan", type: "Aset", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },

  // 2-xxxx: KEWAJIBAN
  { code: "2-0000", name: "KEWAJIBAN", type: "Kewajiban", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1000", name: "KEWAJIBAN JANGKA PENDEK", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1100", name: "Utang Usaha / Dagang", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1200", name: "Utang Gaji & Tunjangan", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1300", name: "UTANG PAJAK", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1301", name: "PPN Keluaran", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1302", name: "Utang PPh 21", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1303", name: "Utang PPh 23", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1400", name: "Biaya yang Masih Harus Dibayar", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2000", name: "KEWAJIBAN JANGKA PANJANG", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2100", name: "Utang Bank Jangka Panjang", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2200", name: "Utang Sewa Pembiayaan", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },

  // 3-xxxx: EKUITAS
  { code: "3-0000", name: "EKUITAS", type: "Ekuitas", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-1000", name: "Modal Saham", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-2000", name: "Laba Ditahan", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-3000", name: "Laba (Rugi) Tahun Berjalan", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-9000", name: "Dividen / Prive", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 4-xxxx: PENDAPATAN
  { code: "4-0000", name: "PENDAPATAN", type: "Pendapatan", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1000", name: "PENDAPATAN USAHA", type: "Pendapatan", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1100", name: "Penjualan Barang Dagang", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1200", name: "Pendapatan Jasa", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1900", name: "Retur & Potongan Penjualan", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 5-xxxx: HPP
  { code: "5-0000", name: "HARGA POKOK PENJUALAN", type: "HPP", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1000", name: "HPP Barang Dagang", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-2000", name: "Beban Pokok Produksi", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 6-xxxx: BEBAN OPERASIONAL
  { code: "6-0000", name: "BEBAN OPERASIONAL", type: "Beban Penjualan", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1000", name: "BEBAN GAJI & TUNJANGAN", type: "Beban Umum & Admin", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1100", name: "Beban Gaji Karyawan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1200", name: "Beban Lembur & Bonus", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-2000", name: "BEBAN ADMINISTRASI & UMUM", type: "Beban Umum & Admin", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-2100", name: "Beban Sewa Gedung", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-2200", name: "Beban Listrik, Air & Telepon", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-2300", name: "Beban Perbaikan & Pemeliharaan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-2400", name: "Beban Perlengkapan Kantor", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-3000", name: "BEBAN PENYUSUTAN", type: "Beban Umum & Admin", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-3100", name: "Beban Penyusutan Bangunan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-3200", name: "Beban Penyusutan Kendaraan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-3300", name: "Beban Penyusutan Peralatan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 8-xxxx: PENDAPATAN/BEBAN LAIN-LAIN
  { code: "8-0000", name: "PENDAPATAN & BEBAN LAIN-LAIN", type: "Lain-lain", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1000", name: "Pendapatan Bunga Bank", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-2000", name: "Beban Bunga Pinjaman", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "8-3000", name: "Beban Administrasi Bank", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "8-4000", name: "Laba (Rugi) Selisih Kurs", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-5000", name: "Beban Pajak Penghasilan (PPh)", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
];

const categories = [
  "All Accounts",
  "Aset",
  "Kewajiban",
  "Ekuitas",
  "Pendapatan",
  "HPP",
  "Beban Penjualan",
  "Beban Umum & Admin",
  "Lain-lain"
];

export default function ChartOfAccounts() {
  const [coaData, setCoaData] = useState<Account[]>(initialCoaData);
  const [realTimeBalances, setRealTimeBalances] = useState<Record<string, any>>({});
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All Accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({ startRow: 2, endRow: 1000, selectedSheet: "" });
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [importReport, setImportReport] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    code: "",
    name: "",
    type: "Aset",
    level: "Rincian Akun",
    normalBalance: "Debit",
    saldo: 0,
    accountNumber: ""
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  useEffect(() => {
    async function loadData() {
      setBalancesLoading(true);
      try {
        const [data, balances] = await Promise.all([
          getCOAData(),
          getAccountBalances('2099-12-31') // Use far future date to get ALL transactions
        ]);
        
        if (data && (data as any).accounts) {
          setCoaData((data as any).accounts);
        }
        if (balances) {
          setRealTimeBalances(balances);
        }
      } catch (error) {
        console.error("Error loading COA data:", error);
      } finally {
        setBalancesLoading(false);
      }
    }
    loadData();
  }, []);

  const saveToFirebase = async (data: Account[]) => {
    setImportStatus("Saving to Cloud...");
    const res = await updateCOAData(data);
    if (res.success) {
      setImportStatus("Synced with Cloud ✅");
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus("Cloud Sync Error ❌");
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.code || !newAccount.name) {
      setImportStatus("Error: Code and Name are required.");
      return;
    }
    if (coaData.some(acc => acc.code === newAccount.code)) {
      setImportStatus("Error: Account code already exists.");
      return;
    }

    const newData = [...coaData, newAccount as Account];
    newData.sort((a, b) => a.code.localeCompare(b.code));
    setCoaData(newData);
    setShowAddModal(false);
    setNewAccount({ code: "", name: "", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0, accountNumber: "" }); // Reset
    await saveToFirebase(newData);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditAccount({ ...acc });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editAccount) return;
    const newData = coaData.map(acc => acc.code === editAccount.code ? editAccount : acc);
    setCoaData(newData);
    setShowEditModal(false);
    setEditAccount(null);
    await saveToFirebase(newData);
  };

  const handleDeleteAccount = async (code: string) => {
    const acc = coaData.find(a => a.code === code);
    if (!acc) return;
    if (!confirm(`Hapus akun "${acc.name}" (${code})? Tindakan ini tidak bisa dibatalkan.`)) return;
    const newData = coaData.filter(a => a.code !== code);
    setCoaData(newData);
    await saveToFirebase(newData);
  };

  const getAccountType = (code: string) => {
    const prefix = code.charAt(0);
    switch (prefix) {
      case '1': return 'Aset';
      case '2': return 'Kewajiban';
      case '3': return 'Ekuitas';
      case '4': return 'Pendapatan';
      case '5': return 'HPP';
      case '6': return 'Beban Penjualan';
      case '7': return 'Beban Umum & Admin';
      case '8': return 'Lain-lain';
      default: return 'Lain-lain';
    }
  };

  const getAccountLevel = (code: string): Account['level'] => {
    if (code.endsWith("-0000")) return "Master Akun";
    if (code.endsWith("000")) return "Master Akun";
    if (code.endsWith("00")) return "Sub Akun";
    return "Rincian Akun";
  };

  const findValue = (obj: any, variants: string[]) => {
    const key = Object.keys(obj).find(k => 
      variants.some(v => k.toLowerCase().includes(v.toLowerCase()))
    );
    return key ? obj[key] : null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setWorkbook(wb);
        setAvailableSheets(wb.SheetNames);
        setImportConfig(prev => ({ ...prev, selectedSheet: wb.SheetNames[0] }));
        setShowImportModal(true);
      } catch (err) {
        alert("Gagal membaca file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    if (!workbook || !importConfig.selectedSheet) return;

    setImportStatus("Memproses Impor...");
    try {
      const ws = workbook.Sheets[importConfig.selectedSheet];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
      const headerRow = rows[0] || [];
      const dataRows = rows.slice(importConfig.startRow - 1, importConfig.endRow);

      if (dataRows.length === 0) {
        alert("Tidak ada data di rentang baris tersebut.");
        return;
      }

      const getColIdx = (possible: string[]) => {
        return headerRow.findIndex((h: any) => h && possible.some(p => String(h).toLowerCase().includes(p)));
      };

      const codeIdx = getColIdx(['no akun', 'code', 'kode']);
      const nameIdx = getColIdx(['name akun', 'nama', 'keterangan']);

      const importedAccounts: Account[] = [];
      const seenInFile = new Set<string>();
      const report: any[] = [];
      let newCount = 0;
      let updatedCount = 0;
      let duplicateInFileCount = 0;

      dataRows.forEach((row, idx) => {
        if (!row || row.length === 0) return;
        const code = String(row[codeIdx] || "").trim();
        const name = String(row[nameIdx] || "").trim();
        const rowNum = importConfig.startRow + idx;

        if (!code || !name) {
          report.push({ row: rowNum, code: code || "?", name: name || "?", type: 'error', msg: "Kode atau Nama kosong." });
          return;
        }

        if (seenInFile.has(code)) {
          duplicateInFileCount++;
          report.push({ row: rowNum, code, name, type: 'error', msg: "Nama akun sebelumnya sudah ada." });
          return;
        }
        seenInFile.add(code);

        const existing = coaData.find(acc => acc.code === code);
        
        // Validation: Master Akun & Sub Akun cannot be renamed
        if (existing && (existing.level === 'Master' || existing.level === 'Master Akun' || existing.level === 'Sub Akun')) {
          if (existing.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
             report.push({ row: rowNum, code, name, type: 'error', msg: `Nama Master/Sub "${existing.name}" tidak boleh diubah.` });
             return;
          }
        }

        if (existing) updatedCount++;
        else newCount++;

        importedAccounts.push({
          code,
          name,
          type: getAccountType(code),
          level: getAccountLevel(code),
          normalBalance: existing?.normalBalance || (code.startsWith('1') || code.startsWith('5') || code.startsWith('6') || code.startsWith('7') ? 'Debit' : 'Kredit'),
          saldo: existing?.saldo || 0
        });
        report.push({ row: rowNum, code, name, type: 'success', msg: existing ? "Diperbarui." : "Ditambahkan." });
      });

      setImportReport(report);

      if (importedAccounts.length === 0) {
        setImportStatus("Tidak ada akun valid ditemukan ❌");
        return;
      }

      // Merge and sort
      const newData = [...coaData];
      importedAccounts.forEach(imp => {
        const index = newData.findIndex(curr => curr.code === imp.code);
        if (index > -1) newData[index] = imp;
        else newData.push(imp);
      });

      newData.sort((a, b) => a.code.localeCompare(b.code));
      setCoaData(newData);
      await saveToFirebase(newData);
      
      let msg = `Berhasil: ${newCount} baru, ${updatedCount} diperbarui ✅`;
      if (duplicateInFileCount > 0) {
        msg += ` (${duplicateInFileCount} kode ganda di file diabaikan)`;
      }
      setImportStatus(msg);
      setShowImportModal(false);
    } catch (err) {
      setImportStatus("Gagal memproses file ❌");
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      setImportStatus("Preparing Export...");
      const companyData = await getCompanyInfo() as any;
      const companyName = companyData?.profile?.name || "[NAMA PERUSAHAAN]";
      const address = companyData?.profile?.address || "[ALAMAT PERUSAHAAN]";
      const city = companyData?.profile?.city || "";
      const fullAddress = `${address}${city ? ', ' + city : ''}`;
      const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("COA");

      // Header
      worksheet.mergeCells("A1:C1");
      worksheet.getCell("A1").value = companyName;
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A1").alignment = { horizontal: 'center' };

      worksheet.mergeCells("A2:C2");
      worksheet.getCell("A2").value = fullAddress;
      worksheet.getCell("A2").font = { italic: true, size: 10 };
      worksheet.getCell("A2").alignment = { horizontal: 'center' };

      worksheet.mergeCells("A4:C4");
      const dateCell = worksheet.getCell("A4");
      dateCell.value = `Dicetak tanggal: ${printDate}`;
      dateCell.font = { italic: true, color: { argb: 'FFFF0000' }, size: 10 };

      worksheet.mergeCells("A6:C6");
      worksheet.getCell("A6").value = "Chart of Account";
      worksheet.getCell("A6").font = { bold: true, size: 12 };
      worksheet.getCell("A6").alignment = { horizontal: 'center' };

      // Table Header
      const headerRow = worksheet.getRow(8);
      headerRow.values = ["No Akun", "Name Akun", "Kriteria"];
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' }
        };
      });

      // Data
      coaData.forEach((acc) => {
        const row = worksheet.addRow([acc.code, acc.name, acc.level]);
        if (acc.level === "Master" || acc.level === "Master Akun") {
          row.font = { bold: true };
        }
      });

      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 50;
      worksheet.getColumn(3).width = 20;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `COA_${companyName.replace(/\s+/g, '_')}.xlsx`);
      setImportStatus("Export Successful! ✅");
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setImportStatus("Error during export ❌");
    }
  };

  const handleReset = async () => {
    if (confirm("Apakah Anda yakin ingin RESET SEMUA DATA? Tindakan ini akan menghapus seluruh data COA dan SELURUH TRANSAKSI (Voucher & Jurnal).")) {
      setImportStatus("Resetting all data...");
      try {
        // Reset COA
        setCoaData(initialCoaData);
        await saveToFirebase(initialCoaData);

        // Reset Transactions
        await Promise.all([
          saveJournals([]),
          saveVouchers([])
        ]);

        setRealTimeBalances({});
        setImportStatus("Semua data berhasil di-reset ✅");
        setTimeout(() => setImportStatus(null), 3000);
      } catch (error) {
        console.error("Reset error:", error);
        setImportStatus("Gagal reset data ❌");
      }
    }
  };

  const filteredData = coaData.filter(acc => {
    const matchesTab = activeTab === "All Accounts" || acc.type === activeTab;
    const matchesSearch = acc.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         acc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getDisplayedBalance = (acc: Account) => {
    // If we are still loading, show static saldo as fallback
    if (balancesLoading) return acc.saldo || 0;

    if (acc.level === "Rincian Akun") {
      return realTimeBalances[acc.code]?.balance ?? acc.saldo ?? 0;
    }
    
    // Sum up children for Master/Sub accounts
    const prefix = acc.code.replace(/0+$/, '');
    return coaData
      .filter(a => a.level === "Rincian Akun" && a.code.startsWith(prefix))
      .reduce((sum, a) => sum + (realTimeBalances[a.code]?.balance ?? a.saldo ?? 0), 0);
  };

  const getIndentClass = (level: string) => {
    switch (level) {
      case 'Master Akun': return 'pl-8';
      case 'Sub Akun': return 'pl-14';
      case 'Rincian Akun': return 'pl-20';
      default: return 'pl-4';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Aset': return 'bg-blue-50 text-blue-700';
      case 'Kewajiban': return 'bg-orange-50 text-orange-700';
      case 'Ekuitas': return 'bg-emerald-50 text-emerald-700';
      case 'Pendapatan': return 'bg-purple-50 text-purple-700';
      case 'HPP': return 'bg-rose-50 text-rose-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Loading Overlay */}
      {balancesLoading && (
        <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-bounce">
           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
           <span className="text-xs font-black uppercase tracking-widest">Calculating Real-time Balances...</span>
        </div>
      )}


      <main className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                 <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <div>
                 <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">Chart of Accounts</h1>
                 <p className="text-slate-500 font-medium mt-0.5 text-sm">Manage and classify your financial account structure</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              {importReport.length > 0 && (
                <button 
                  onClick={() => setShowImportModal(false) /* Just reuse a toggle if needed or just show the report section */}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-bold shadow-lg shadow-slate-900/10"
                  onClick={() => {
                    const el = document.getElementById('import-monitoring');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="material-symbols-outlined text-lg">analytics</span>
                  Monitoring Impor
                </button>
              )}
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm font-bold"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
                Reset Data
              </button>
            </div>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              importStatus.includes('Gagal') || importStatus.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 
              importStatus.includes('Berhasil') || importStatus.includes('Success') || importStatus.includes('successful') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
              'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              <span className="material-symbols-outlined">
                {importStatus.includes('Gagal') || importStatus.includes('Error') ? 'error' : (importStatus.includes('Berhasil') || importStatus.includes('Success') || importStatus.includes('successful')) ? 'check_circle' : 'info'}
              </span>
              {importStatus}
            </div>
          )}

          {/* Controls Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Monitoring Section at the top right of this area or floating? User said right top */}
              <div className="relative w-full md:max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-medium"
                />
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-amber-500/50 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Import Excel
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-500/50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Export Excel
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 signature-gradient text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Account
                </button>
              </div>
            </div>

            {/* Import Monitoring Panel (Conditional) */}
            {importReport.length > 0 && (
              <div id="import-monitoring" className="mt-8 p-6 bg-slate-900 rounded-3xl text-white animate-in slide-in-from-right-8 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">rule</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Monitoring Impor Terakhir</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Detail keberhasilan dan kegagalan setiap baris</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setImportReport([])}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
                    title="Bersihkan log"
                  >
                    <span className="material-symbols-outlined">delete_sweep</span>
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {importReport.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                      r.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}>
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-[10px] font-black text-slate-500 w-12 shrink-0">ROW {r.row}</span>
                        <div className="flex flex-col w-24 shrink-0">
                          <span className="text-xs font-mono font-black text-slate-400 leading-tight">{r.code}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-bold truncate">{r.name}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${r.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.msg}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-600 shrink-0 ml-4">
                        {r.type === 'success' ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200">Code</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200">Account Name</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200">Type</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200">Normal Balance</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 text-right">Saldo Akhir</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredData.map((acc) => (
                    <tr key={acc.code} onClick={() => handleOpenEdit(acc)} className="hover:bg-blue-50/40 transition-colors group cursor-pointer" title="Klik untuk edit akun">
                      <td className={`px-6 py-4 text-sm font-bold ${acc.level === 'Master' ? 'text-blue-600' : 'text-slate-500'}`}>
                        {acc.code}
                      </td>
                      <td className={`px-6 py-4 ${getIndentClass(acc.level)}`}>
                        <div className="flex items-center gap-3">
                          {acc.level !== 'Master' && acc.level !== 'Master Akun' && (
                            <span className="material-symbols-outlined text-slate-300 text-sm">subdirectory_arrow_right</span>
                          )}
                          <div className="flex flex-col">
                            <span className={`text-sm ${
                              acc.level === 'Master' || acc.level === 'Master Akun' || acc.level === 'Sub Akun'
                                ? 'font-extrabold text-slate-900 uppercase tracking-tight italic' 
                                : 'font-semibold text-slate-600'
                            }`}>
                              {acc.name}
                            </span>
                            {acc.name.toUpperCase().includes('BANK') && acc.accountNumber && (
                              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                                No. Rek: {acc.accountNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getTypeColor(acc.type)}`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                        {acc.normalBalance}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(getDisplayedBalance(acc))}
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                            title="Edit akun"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc.code)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Hapus akun"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Add New Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1-1205"
                  value={newAccount.code}
                  onChange={e => setNewAccount({...newAccount, code: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kas Kecil"
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Type (Kelompok)</label>
                <select 
                  value={newAccount.type}
                  onChange={e => {
                    // Auto-select normal balance based on type
                    let nb = "Debit";
                    const t = e.target.value;
                    if (t === "Kewajiban" || t === "Ekuitas" || t === "Pendapatan") nb = "Kredit";
                    setNewAccount({...newAccount, type: t, normalBalance: nb as any});
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                >
                  {categories.filter(c => c !== "All Accounts").map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Level</label>
                  <select 
                    value={newAccount.level}
                    onChange={e => setNewAccount({...newAccount, level: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="Master Akun">Master Akun</option>
                    <option value="Sub Akun">Sub Akun</option>
                    <option value="Rincian Akun">Rincian Akun</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Normal Balance</label>
                  <select 
                    value={newAccount.normalBalance}
                    onChange={e => setNewAccount({...newAccount, normalBalance: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </div>
              </div>
              {newAccount.name?.toUpperCase().includes('BANK') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    No. Rekening Bank
                    <span className="ml-2 text-xs font-normal text-slate-400">(opsional, untuk penomoran voucher)</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={newAccount.accountNumber || ""}
                    onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">3 digit terakhir akan digunakan sebagai bagian nomor bukti voucher bank.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddAccount} className="px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">Save Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && editAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit Akun</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{editAccount.code}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditAccount(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Akun</label>
                <input
                  type="text"
                  value={editAccount.name}
                  onChange={e => setEditAccount({ ...editAccount, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipe Akun</label>
                <select
                  value={editAccount.type}
                  onChange={e => {
                    let nb = "Debit";
                    const t = e.target.value;
                    if (t === "Kewajiban" || t === "Ekuitas" || t === "Pendapatan") nb = "Kredit";
                    setEditAccount({ ...editAccount, type: t, normalBalance: nb as any });
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                >
                  {["Aset","Kewajiban","Ekuitas","Pendapatan","HPP","Beban Penjualan","Beban Umum & Admin","Lain-lain"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Level</label>
                  <select
                    value={editAccount.level}
                    onChange={e => setEditAccount({ ...editAccount, level: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="Master Akun">Master Akun</option>
                    <option value="Sub Akun">Sub Akun</option>
                    <option value="Rincian Akun">Rincian Akun</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Normal Balance</label>
                  <select
                    value={editAccount.normalBalance}
                    onChange={e => setEditAccount({ ...editAccount, normalBalance: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </div>
              </div>
              {editAccount.name.toUpperCase().includes('BANK') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    No. Rekening Bank
                    <span className="ml-2 text-xs font-normal text-slate-400">(untuk penomoran voucher)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={editAccount.accountNumber || ""}
                    onChange={e => setEditAccount({ ...editAccount, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">3 digit terakhir akan digunakan sebagai bagian nomor bukti voucher bank.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => { setShowEditModal(false); setEditAccount(null); }}
                className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleEditSave}
                className="px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black font-headline">Import Chart of Accounts</h2>
                  <p className="text-amber-100 font-medium mt-1">Konfigurasi kolom dan baris data COA Anda.</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Sheet</label>
                  <select 
                    value={importConfig.selectedSheet}
                    onChange={e => setImportConfig({...importConfig, selectedSheet: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Baris Mulai</label>
                    <input 
                      type="number" 
                      value={importConfig.startRow}
                      onChange={e => setImportConfig({...importConfig, startRow: parseInt(e.target.value) || 2})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Baris Akhir</label>
                    <input 
                      type="number" 
                      value={importConfig.endRow}
                      onChange={e => setImportConfig({...importConfig, endRow: parseInt(e.target.value) || 1000})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">info</span>
                  Panduan Kolom (Header)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
                    No Akun / Code / Kode
                  </div>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
                    Nama Akun / Nama / Keterangan
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-5 flex justify-end gap-3 border-t border-slate-200">
              <button 
                onClick={() => setShowImportModal(false)} 
                className="px-6 py-2.5 text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleProcessImport}
                className="px-8 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Proses Impor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
