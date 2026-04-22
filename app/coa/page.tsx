"use client";

import { useState, useRef, useEffect } from "react";

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getCOAData, updateCOAData, getCompanyInfo } from "@/lib/dataService";

interface Account {
  code: string;
  name: string;
  type: string;
  level: 'Master' | 'Master Akun' | 'Sub Akun' | 'Rincian Akun';
  normalBalance: 'Debit' | 'Kredit';
  saldo: number;
}

const initialCoaData: Account[] = [
  // 1-xxxx: ASET
  { code: "1-0000", name: "ASET (HARTA)", type: "Aset", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1000", name: "ASET LANCAR", type: "Aset", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1200", name: "KAS & SETARA KAS", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1201", name: "Kas", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1202", name: "Bank AAA", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1203", name: "Bank BBB", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1204", name: "Bank CCC", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1300", name: "PIUTANG DAGANG", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1301", name: "Piutang AAA", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1302", name: "Piutang BBB", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1303", name: "Piutang CCC", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1400", name: "PERSEDIAAN", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1401", name: "Persediaan Barang Dagang", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1500", name: "PAJAK DIBAYAR DI MUKA", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1501", name: "Uang Muka Pajak (Deposito)", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1502", name: "Uang Muka Pajak PPN", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1503", name: "PPN Masukan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-1504", name: "Uang Muka Pajak PPh 29 (Lebih bayar SPT Badan)", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2000", name: "ASET LANCAR LAINNYA", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2001", name: "Piutang Direksi", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2002", name: "Piutang Komisaris", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2003", name: "Piutang Pemegang Saham", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2004", name: "Piutang Lainnya", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2005", name: "Biaya Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2006", name: "Sewa Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2007", name: "Asuransi Dibayar di Muka", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-2008", name: "Uang Muka Pembelian", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3000", name: "ASET TETAP", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3100", name: "Tanah", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3200", name: "Bangunan atau Gedung", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3201", name: "Akumulasi Penyusutan - Bangunan atau Gedung", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3300", name: "Kendaraan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3301", name: "Akumulasi Penyusutan - Kendaraan", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3400", name: "Peralatan atau Mesin", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3401", name: "Akumulasi Penyusutan - Peralatan atau Mesin", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3500", name: "Inventaris Kantor", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-3501", name: "Akumulasi Penyusutan - Inventaris Kantor", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-4000", name: "ASET TIDAK BERWUJUD", type: "Aset", level: "Sub Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-4001", name: "Hak Cipta", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-4002", name: "Hak Paten", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-4003", name: "Goodwill", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "1-4004", name: "Amortisasi", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  
  // 2-xxxx: KEWAJIBAN
  { code: "2-0000", name: "KEWAJIBAN DAN EKUITAS", type: "Kewajiban", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1000", name: "KEWAJIBAN JANGKA PENDEK", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1200", name: "UTANG DAGANG", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1201", name: "Utang AAA", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1202", name: "Utang BBB", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1203", name: "Utang CCC", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1300", name: "UTANG PAJAK", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1301", name: "Utang Pajak PPh 21", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1302", name: "Utang Pajak PPh 23", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1303", name: "Utang Pajak PPh 4(2)", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1304", name: "Utang Pajak PPh 25", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1305", name: "Utang Pajak PPh 29 (Kurang bayar SPT Badan)", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1306", name: "Utang Pajak PPN", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-1307", name: "PPN Keluaran", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2000", name: "KEWAJIBAN JANGKA PENDEK LAINNYA", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2001", name: "Utang Gaji Karyawan", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2002", name: "Utang Direksi", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2003", name: "Utang Komisaris", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2004", name: "Utang Lainnya", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-2005", name: "Utang Muka Penjualan", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-3000", name: "KEWAJIBAN JANGKA PANJANG", type: "Kewajiban", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-3001", name: "Utang Bank AAA", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-3002", name: "Utang Bank BBB", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-3003", name: "Utang Bank CCC", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "2-3004", name: "Utang Leasing Kendaraan", type: "Kewajiban", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },

  // 3-xxxx: EKUITAS
  { code: "3-0000", name: "EKUITAS", type: "Ekuitas", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-0001", name: "Modal", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-0002", name: "Dividen", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-1000", name: "LABA DITAHAN TAHUN SEBELUMNYA", type: "Ekuitas", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-1001", name: "Profit (Loss) Tahun 2022", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-1002", name: "Profit (Loss) Tahun 2023", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-1003", name: "Profit (Loss) Tahun 2024", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-2000", name: "LABA DITAHAN TAHUN BERJALAN", type: "Ekuitas", level: "Sub Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "3-2001", name: "Profit (Loss) Tahun 2025", type: "Ekuitas", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },

  // 4-xxxx: PENDAPATAN
  { code: "4-0000", name: "PENJUALAN BERSIH", type: "Pendapatan", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1001", name: "Penjualan Domestik", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1002", name: "Penjualan Ekspor", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1003", name: "Diskon Penjualan", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "4-1004", name: "Retur Penjualan", type: "Pendapatan", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },

  // 5-xxxx: HPP
  { code: "5-0000", name: "HARGA POKOK PENJUALAN", type: "HPP", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1001", name: "Persediaan Awal", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1002", name: "Pembelian Lokal", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1003", name: "Pembelian Impor", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1004", name: "Diskon Pembelian", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1005", name: "Retur Pembelian", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "5-1006", name: "Persediaan Akhir", type: "HPP", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 6-xxxx: BEBAN PENJUALAN
  { code: "6-0000", name: "BEBAN PENJUALAN ATAU BEBAN POKOK PENJUALAN", type: "Beban Penjualan", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1001", name: "Beban Pengangkutan", type: "Beban Penjualan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1002", name: "Beban Iklan", type: "Beban Penjualan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1003", name: "Beban Penyusutan - Peralatan atau Mesin", type: "Beban Penjualan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1004", name: "Beban Promosi", type: "Beban Penjualan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "6-1005", name: "Beban Penjualan", type: "Beban Penjualan", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 7-xxxx: BEBAN UMUM & ADMIN
  { code: "7-0000", name: "BEBAN UMUM DAN ADMINISTRASI", type: "Beban Umum & Admin", level: "Master Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1001", name: "Beban Gaji, Tunjangan, Bonus, THR, dsb", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1002", name: "Beban Penyusutan - Bangunan atau Gedung", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1003", name: "Beban Penyusutan - Kendaraan", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1004", name: "Beban Penyusutan - Inventaris Kantor", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1005", name: "Beban Sewa Kantor", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "7-1006", name: "Beban Entertainment", type: "Beban Umum & Admin", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },

  // 8-xxxx: PENDAPATAN/BEBAN LAIN
  { code: "8-0000", name: "PENDAPATAN (BEBAN) DI LUAR USAHA", type: "Lain-lain", level: "Master Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1001", name: "Pendapatan Bunga Bank", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1002", name: "Pendapatan Lain-Lain", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1003", name: "Keuntungan (Kerugian) Selisih Kurs", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1004", name: "Keuntungan (Kerugian) Penjualan Aset Tetap", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Kredit", saldo: 0 },
  { code: "8-1005", name: "Beban Bunga Bank", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "8-1006", name: "Beban Lain-Lain", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
  { code: "9-0001", name: "Beban Pajak Penghasilan", type: "Lain-lain", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 },
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
  const [activeTab, setActiveTab] = useState("All Accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    code: "",
    name: "",
    type: "Aset",
    level: "Rincian Akun",
    normalBalance: "Debit",
    saldo: 0
  });

  useEffect(() => {
    async function loadData() {
      const data = await getCOAData() as any;
      if (data && data.accounts) {
        setCoaData(data.accounts);
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
    setNewAccount({ code: "", name: "", type: "Aset", level: "Rincian Akun", normalBalance: "Debit", saldo: 0 }); // Reset
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("Importing...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          setImportStatus("Error: File is empty or invalid format.");
          return;
        }

        const importedAccounts: Account[] = data.map((item: any) => {
          const code = String(findValue(item, ['no akun', 'code', 'kode']) || "");
          const name = String(findValue(item, ['name akun', 'nama', 'keterangan']) || "");
          
          if (!code || !name) return null;

          const existing = coaData.find(acc => acc.code === code);
          
          // Validation: Master Akun & Sub Akun cannot be renamed
          if (existing && (existing.level === 'Master' || existing.level === 'Master Akun' || existing.level === 'Sub Akun')) {
            if (existing.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
              throw new Error(`Master/Sub Akun "${code}" tidak bisa diubah namanya via import! (Harus: ${existing.name})`);
            }
          }

          return {
            code,
            name,
            type: getAccountType(code),
            level: getAccountLevel(code),
            normalBalance: (findValue(item, ['balance', 'saldo normal', 'normal']) || (existing?.normalBalance || 'Debit')) as any,
            saldo: Number(findValue(item, ['saldo', 'amount', 'akhir']) || (existing?.saldo || 0))
          };
        }).filter(Boolean) as Account[];

        if (importedAccounts.length === 0) {
          setImportStatus("Error: No valid accounts found. Check column names (Code, Name, etc).");
          return;
        }

        // Merge and sort
        const newData = [...coaData];
        importedAccounts.forEach(imp => {
          const index = newData.findIndex(curr => curr.code === imp.code);
          if (index > -1) {
            newData[index] = imp;
          } else {
            newData.push(imp);
          }
        });

        newData.sort((a, b) => a.code.localeCompare(b.code));
        setCoaData(newData);
        setImportStatus(`Success: Imported ${importedAccounts.length} accounts!`);
        
        // Sync to Firebase
        await saveToFirebase(newData);
      } catch (err) {
        setImportStatus("Error: Failed to process file.");
        console.error(err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
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
    if (confirm("Are you sure you want to reset all data?")) {
      setCoaData(initialCoaData);
      await saveToFirebase(initialCoaData);
    }
  };

  const filteredData = coaData.filter(acc => {
    const matchesTab = activeTab === "All Accounts" || acc.type === activeTab;
    const matchesSearch = acc.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         acc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    if (value === 0) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value).replace("Rp", "Rp.");
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
            
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm font-bold"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              Reset Data
            </button>
          </div>

          {importStatus && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              importStatus.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 
              importStatus.includes('Success') || importStatus.includes('successful') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
              'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              <span className="material-symbols-outlined">
                {importStatus.includes('Error') ? 'error' : (importStatus.includes('Success') || importStatus.includes('successful')) ? 'check_circle' : 'info'}
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
                  onChange={handleImportExcel}
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
                    <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors group">
                      <td className={`px-6 py-4 text-sm font-bold ${acc.level === 'Master' ? 'text-blue-600' : 'text-slate-500'}`}>
                        {acc.code}
                      </td>
                      <td className={`px-6 py-4 ${getIndentClass(acc.level)}`}>
                        <div className="flex items-center gap-3">
                          {acc.level !== 'Master' && acc.level !== 'Master Akun' && (
                            <span className="material-symbols-outlined text-slate-300 text-sm">subdirectory_arrow_right</span>
                          )}
                          <span className={`text-sm ${
                            acc.level === 'Master' || acc.level === 'Master Akun' || acc.level === 'Sub Akun'
                              ? 'font-extrabold text-slate-900 uppercase tracking-tight italic' 
                              : 'font-semibold text-slate-600'
                          }`}>
                            {acc.name}
                          </span>
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
                        {formatCurrency(acc.saldo)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">more_vert</span>
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
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddAccount} className="px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">Save Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
