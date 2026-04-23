"use client";

import { useState, useEffect, useRef } from "react";

import { getVouchers, saveVouchers, getCOAData } from "@/lib/dataService";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import { parseRobustAmount, parseRobustDate } from "@/lib/reportUtils";

interface VoucherDetail {
  id: string;
  accountId: string;
  accountName: string;
  amount: number;
}

interface Voucher {
  id: string;
  date: string;
  no: string;
  bukuKas: string;
  type: "Masuk" | "Keluar";
  description: string;
  details: VoucherDetail[];
  lastEditedBy?: string;
  lastEditedAt?: string;
}

interface Account {
  code: string;
  name: string;
  level: string;
  accountNumber?: string;
}

interface AccountSelectProps {
  value: string;
  onChange: (val: string) => void;
  coaList: Account[];
}

function AccountSelect({ value, onChange, coaList }: AccountSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      const acc = coaList.find(a => a.code === value);
      if (acc) setSearch(`${acc.code} — ${acc.name}`);
      else setSearch("");
    }
  }, [value, coaList, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = coaList.filter(a => `${a.code} ${a.name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${open ? 'z-50' : 'z-10'}`} ref={wrapperRef}>
      <div className="relative">
        <input 
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder="- Ketik Kode / Nama Akun -"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-8"
        />
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
          arrow_drop_down
        </span>
      </div>
      {open && (
        <div className="absolute z-50 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded-lg mt-1 py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 italic">Akun tidak ditemukan</div>
          ) : (
            filtered.map(a => (
              <div 
                key={a.code} 
                onClick={() => { onChange(a.code); setOpen(false); }}
                className={`px-4 py-2 cursor-pointer text-sm transition-colors ${value === a.code ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                {a.code} — {a.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CashBankVoucher() {
  const { userData } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [coaList, setCoaList] = useState<Account[]>([]);
  const [kasBankList, setKasBankList] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [bukuKasFilter, setBukuKasFilter] = useState("ALL");
  const [showMasuk, setShowMasuk] = useState(true);
  const [showKeluar, setShowKeluar] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({ startRow: 2, endRow: 1000, selectedSheet: "" });
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAutoNo, setIsAutoNo] = useState(true);

  // Singkatan kas: hapus vokal tiap kata, ambil 2 konsonan pertama, gabungkan
  const getKasAbbrev = (name: string): string => {
    const words = name.trim().split(/\s+/);
    return words.map(word => {
      const consonants = word.replace(/[aeiouAEIOU]/g, '');
      return (consonants.length >= 2 ? consonants.substring(0, 2) : word.substring(0, 2)).toUpperCase();
    }).join('');
  };

  // Kode bank: 3 huruf pertama nama bank (setelah kata "Bank")
  const getBankCode = (name: string): string => {
    const upper = name.toUpperCase().trim();
    const match = upper.match(/BANK\s+([A-Z0-9]+)/);
    if (match && match[1]) return match[1].substring(0, 3);
    return upper.replace(/[AEIOU\s]/g, '').substring(0, 3);
  };

  // Generate nomor bukti otomatis berdasarkan tipe akun, tipe transaksi, dan tanggal
  const generateNextNo = (currentVouchers: Voucher[], type: "Masuk" | "Keluar", accountCode: string, date?: string): string => {
    const acc = kasBankList.find(a => a.code === accountCode);
    if (!acc) return "";

    const typeCode = type === "Masuk" ? "M" : "K";
    const dateObj = date ? new Date(date) : new Date();
    const year = dateObj.getFullYear().toString();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');

    const isBank = acc.name.toUpperCase().includes("BANK");
    let prefix: string;

    if (isBank) {
      const bankCode = getBankCode(acc.name);
      const rekening = acc.accountNumber ? String(acc.accountNumber).slice(-3) : "000";
      prefix = `${bankCode}${rekening}-${typeCode}-${year}-${month}-`;
    } else {
      const kasCode = getKasAbbrev(acc.name);
      prefix = `${kasCode}-${typeCode}-${year}-${month}-`;
    }

    const matching = currentVouchers.filter(v => v.no.startsWith(prefix));
    let max = 0;
    matching.forEach(v => {
      const numStr = v.no.substring(prefix.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  };

  const [newVoucher, setNewVoucher] = useState<Voucher>({
    id: "",
    date: new Date().toISOString().split('T')[0],
    no: "",
    bukuKas: "",
    type: "Keluar",
    description: "",
    details: []
  });

  useEffect(() => {
    async function loadData() {
      const data = await getVouchers();
      setVouchers(data);

      const coa = await getCOAData() as any;
      if (coa && coa.accounts) {
        setCoaList(coa.accounts.filter((a: any) => a.level === "Rincian Akun"));
        setKasBankList(coa.accounts.filter((a: any) => a.level === "Rincian Akun" && (a.code.startsWith("1-11") || a.code.startsWith("1-12"))));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleShowForm = () => {
    const defaultKas = kasBankList.length > 0 ? kasBankList[0].code : "";
    setNewVoucher({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      no: isAutoNo ? generateNextNo(vouchers, "Keluar", defaultKas, new Date().toISOString().split('T')[0]) : "",
      bukuKas: defaultKas,
      type: "Keluar",
      description: "",
      details: [
        { id: Date.now().toString() + "_1", accountId: "", accountName: "", amount: 0 },
        { id: Date.now().toString() + "_2", accountId: "", accountName: "", amount: 0 }
      ]
    });
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && isAutoNo) {
      setNewVoucher(prev => ({
        ...prev,
        no: generateNextNo(vouchers, prev.type, prev.bukuKas, prev.date)
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoNo, newVoucher.type, newVoucher.bukuKas, newVoucher.date, isFormOpen, vouchers, kasBankList]);

  const handleAddDetailRow = () => {
    setNewVoucher(prev => ({
      ...prev,
      details: [...prev.details, { id: Date.now().toString(), accountId: "", accountName: "", amount: 0 }]
    }));
  };

  const handleRemoveDetailRow = (id: string) => {
    setNewVoucher(prev => ({
      ...prev,
      details: prev.details.filter(d => d.id !== id)
    }));
  };

  const handleDetailChange = (id: string, field: keyof VoucherDetail, value: any) => {
    setNewVoucher(prev => ({
      ...prev,
      details: prev.details.map(d => {
        if (d.id === id) {
          const updated = { ...d, [field]: value };
          if (field === "accountId") {
            const acc = coaList.find(a => a.code === value);
            if (acc) updated.accountName = acc.name;
          }
          if (field === "amount") {
            updated.amount = parseFloat(value) || 0;
          }
          return updated;
        }
        return d;
      })
    }));
  };

  const handleSaveVoucher = async () => {
    if (!newVoucher.no || !newVoucher.date || !newVoucher.description || !newVoucher.bukuKas) {
      alert("Harap isi semua kolom header (Buku Kas, Tipe, Tanggal, Nomor, dan Keterangan)!");
      return;
    }

    let validDetails = true;
    let totalAmount = 0;

    newVoucher.details.forEach(d => {
      if (d.amount > 0 && !d.accountId) validDetails = false;
      totalAmount += d.amount;
    });

    if (!validDetails) {
      alert("Pastikan semua baris yang terisi nominal memiliki akun yang dipilih!");
      return;
    }

    if (totalAmount === 0) {
      alert("Total transaksi tidak boleh nol!");
      return;
    }

    setStatusMsg("Menyimpan...");
    
    const cleanedVoucher = {
       ...newVoucher,
       details: newVoucher.details.filter(d => d.accountId && d.amount > 0),
       lastEditedBy: userData?.displayName || "Super Admin",
       lastEditedAt: new Date().toISOString()
    };

    const existingIdx = vouchers.findIndex(v => v.id === newVoucher.id);
    let updatedVouchers;
    if (existingIdx >= 0) {
      updatedVouchers = [...vouchers];
      updatedVouchers[existingIdx] = cleanedVoucher;
    } else {
      updatedVouchers = [cleanedVoucher, ...vouchers];
    }
    
    updatedVouchers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const res = await saveVouchers(updatedVouchers);
    if (res.success) {
      setVouchers(updatedVouchers);
      setIsFormOpen(false);
      setStatusMsg("Voucher berhasil disimpan ✅");
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setStatusMsg("Gagal menyimpan ❌");
    }
  };

  const handleDeleteVoucher = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    
    const updatedVouchers = vouchers.filter(v => v.id !== newVoucher.id);
    const res = await saveVouchers(updatedVouchers);
    
    if (res.success) {
      setVouchers(updatedVouchers);
      setIsFormOpen(false);
      setStatusMsg("Voucher berhasil dihapus 🗑️");
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      alert("Gagal menghapus transaksi.");
    }
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
      } catch (err) {
        alert("Gagal membaca file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleValidateImport = async () => {
    if (!workbook || !importConfig.selectedSheet) return;

    try {
      const ws = workbook.Sheets[importConfig.selectedSheet];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        const headerRow = rows[0] || [];
        const dataRows = rows.slice(importConfig.startRow - 1, importConfig.endRow);

        if (dataRows.length === 0) {
          alert("Tidak ada data di rentang baris tersebut.");
          return;
        }

        const voucherMap = new Map<string, Voucher>();
        const report: any[] = [];
        const coaCodes = new Set(coaList.map(a => a.code));

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return;

          const getColIdx = (possible: string[]) => {
            return headerRow.findIndex((h: any) => h && possible.some(p => String(h).toLowerCase().includes(p)));
          };

          const noIdx = getColIdx(["nomor", "no", "bukti"]);
          const dateIdx = getColIdx(["tanggal", "date"]);
          const typeIdx = getColIdx(["tipe", "masuk", "keluar", "type"]);
          const bukuKasIdx = getColIdx(["buku kas", "bank", "main account", "kas"]);
          const descIdx = getColIdx(["keterangan", "desc"]);
          const accIdx = getColIdx(["akun", "account", "offset"]);
          const amountIdx = getColIdx(["jumlah", "amount", "nominal"]);

          const no = noIdx >= 0 ? String(row[noIdx] || "").trim() : "";
          const dateVal = dateIdx >= 0 ? row[dateIdx] : "";
          const type = typeIdx >= 0 ? String(row[typeIdx] || "").toUpperCase() : "";
          const bukuKas = bukuKasIdx >= 0 ? String(row[bukuKasIdx] || "").trim() : "";
          const desc = descIdx >= 0 ? String(row[descIdx] || "") : "";
          const accCode = accIdx >= 0 ? String(row[accIdx] || "").trim() : "";
          const amount = amountIdx >= 0 ? parseRobustAmount(row[amountIdx]) : 0;

          if (!no) return;

          if (!voucherMap.has(no)) {
            let parsedDate = parseRobustDate(dateVal);
            if (bukuKas && !coaCodes.has(bukuKas)) {
              report.push({ no, type: 'error', msg: `Buku Kas "${bukuKas}" tidak ditemukan di COA.` });
            }

            voucherMap.set(no, {
              id: no + "_" + Date.now(),
              no,
              date: parsedDate,
              type: type.includes("MASUK") || type === "M" ? "Masuk" : "Keluar",
              bukuKas: bukuKas,
              description: desc,
              details: [],
              lastEditedBy: userData?.displayName || "Import",
              lastEditedAt: new Date().toISOString()
            });
          }

          if (accCode) {
            const accExists = coaCodes.has(accCode);
            const acc = coaList.find(a => a.code === accCode);
            
            let warning = "";
            if (acc && desc) {
              const significantWords = acc.name.toLowerCase().split(' ').filter(w => w.length > 3);
              if (significantWords.length > 0 && !significantWords.some(w => desc.toLowerCase().includes(w))) {
                warning = "Boleh dicek kembali terkait transaksi ini apakah sudah sesuai dengan nama akun yang diinput";
              }
            }

            if (!accExists) {
              report.push({ no, type: 'error', msg: `Akun "${accCode}" tidak ditemukan di COA.` });
            } else if (warning) {
              report.push({ no, type: 'warning', msg: `[${accCode}] ${warning}` });
            }

            voucherMap.get(no)!.details.push({
              id: Date.now().toString() + Math.random(),
              accountId: accCode,
              accountName: acc?.name || "",
              description: desc,
              amount
            });
          }
        });

        const validVouchersToSave: Voucher[] = [];
        let hasError = false;
        const existingNos = new Set(vouchers.map(v => v.no));

        voucherMap.forEach((v, no) => {
          const isDuplicate = existingNos.has(no);
          const hasUnknownMain = !v.bukuKas || !coaCodes.has(v.bukuKas);
          const hasUnknownDetails = v.details.some(d => !coaCodes.has(d.accountId));

          if (isDuplicate) {
            report.push({ no, type: 'error', msg: `Nomor Bukti "${no}" sudah ada (Double).` });
            hasError = true;
          } else if (hasUnknownMain || hasUnknownDetails) {
            report.push({ no, type: 'error', msg: `Terdapat akun yang tidak ditemukan.` });
            hasError = true;
          } else {
            validVouchersToSave.push(v);
            report.push({ no, type: 'success', msg: `Valid (${v.details.length} baris)` });
          }
        });

        setImportReport(report);
        if (hasError) {
          setStatusMsg("Impor dibatalkan karena terdapat kesalahan/data ganda. Harap perbaiki laporan di bawah. ❌");
        } else if (validVouchersToSave.length > 0) {
          const merged = [...validVouchersToSave, ...vouchers];
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setVouchers(merged);
          await saveVouchers(merged);
          setStatusMsg(`Berhasil impor ${validVouchersToSave.length} voucher ✅`);
        } else {
          setStatusMsg("Tidak ada voucher yang diproses ❌");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Gagal memproses file ❌");
      }
  };

  const filteredVouchers = vouchers.filter(v => {
    const vDate = new Date(v.date);
    vDate.setHours(0,0,0,0);
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    
    const matchDate = vDate >= start && vDate <= end;
    const matchSearch = v.no.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchKas = bukuKasFilter === "ALL" || v.bukuKas === bukuKasFilter;
    
    const matchType = (showMasuk && v.type === "Masuk") || (showKeluar && v.type === "Keluar");

    return matchDate && matchSearch && matchKas && matchType;
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${d}/${m}/${y}`;
  };
  const formatLogTime = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
  };

  const totalAmountForm = newVoucher.details.reduce((sum, d) => sum + d.amount, 0);
  const isDescriptionFilledForm = newVoucher.description.trim().length > 0;
  const canSaveForm = totalAmountForm > 0 && isDescriptionFilledForm && newVoucher.no.trim().length > 0 && newVoucher.bukuKas;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8 max-w-7xl mx-auto space-y-6 pb-24">
        {!isFormOpen ? (
          <>
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
                    Voucher Kas / Bank
                  </h1>
                </div>
                <p className="text-slate-500 font-medium mt-2 ml-12">
                  Kelola transaksi arus kas masuk dan keluar secara terpusat.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  Import Excel
                </button>
                <button 
                  onClick={handleShowForm}
                  className="px-6 py-2 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Baru
                </button>
              </div>
            </div>

            {statusMsg && (
              <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-3 bg-blue-50 text-blue-600 border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <span className="material-symbols-outlined">info</span>
                {statusMsg}
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex flex-wrap gap-6 items-end justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Buku Kas</label>
                    <select 
                      value={bukuKasFilter}
                      onChange={e => setBukuKasFilter(e.target.value)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48"
                    >
                      <option value="ALL">Semua Kas/Bank</option>
                      {kasBankList.map(k => (
                         <option key={k.code} value={k.code}>{k.code} — {k.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-10 w-px bg-slate-200"></div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tanggal Mulai</label>
                    <DatePicker 
                      selected={startDate}
                      onChange={(date) => setStartDate(date || new Date())}
                      dateFormat="dd/MM/yyyy"
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-32"
                    />
                  </div>
                  <div className="text-sm font-bold text-slate-400 mt-5">s/d</div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tanggal Selesai</label>
                    <DatePicker 
                      selected={endDate}
                      onChange={(date) => setEndDate(date || new Date())}
                      dateFormat="dd/MM/yyyy"
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-32"
                    />
                  </div>
                  <div className="h-10 w-px bg-slate-200 mx-2"></div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
                      <input type="checkbox" checked={showMasuk} onChange={e => setShowMasuk(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                      Kas Masuk
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors">
                      <input type="checkbox" checked={showKeluar} onChange={e => setShowKeluar(e.target.checked)} className="rounded text-rose-500 focus:ring-rose-500" />
                      Kas Keluar
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      type="text" 
                      placeholder="Cari nomor / keterangan..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium min-w-[250px]"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-36">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-40">Tipe & Buku</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-48">Nomor Bukti</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest">Keterangan</th>
                      <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-56 text-right">Log (Terakhir Edit)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Memuat data voucher...</td>
                      </tr>
                    ) : filteredVouchers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Tidak ada data transaksi yang ditemukan.</td>
                      </tr>
                    ) : (
                      filteredVouchers.map((v) => (
                        <tr 
                          key={v.id} 
                          onDoubleClick={() => {
                            setNewVoucher(v);
                            setIsFormOpen(true);
                          }}
                          className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                          title="Klik dua kali untuk melihat / mengedit detail"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {formatDateStr(v.date)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">
                            <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${v.type === 'Masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               {v.type}
                            </span>
                            <div className="text-xs text-slate-500 mt-1.5 font-medium max-w-[120px] truncate" title={coaList.find(a=>a.code === v.bukuKas)?.name}>
                               {v.bukuKas}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-blue-600">{v.no}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{v.description}</td>
                          <td className="px-6 py-4 text-right text-xs text-slate-500">
                            {v.lastEditedBy ? (
                               <div className="flex flex-col items-end">
                                 <span className="font-bold text-slate-700">{v.lastEditedBy}</span>
                                 <span className="text-[11px] text-slate-400 mt-0.5">{formatLogTime(v.lastEditedAt)}</span>
                               </div>
                            ) : <span className="italic text-slate-300">Belum ada log</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
                  Form Input Voucher
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Pencatatan uang masuk dan keluar secara otomatis seimbang (balance).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden flex flex-col">
              <div className="signature-gradient px-8 py-5 flex justify-between items-center">
                <div>
                  <h2 className="text-white font-extrabold text-xl tracking-tight">Detail Transaksi Kas & Bank</h2>
                  <p className="text-blue-100 text-sm font-medium mt-0.5">Sistem akan secara otomatis meletakkan Buku Kas ke sisi Debit/Kredit yang tepat.</p>
                </div>
              </div>
              
              <div className="px-8 py-5 flex-grow bg-slate-50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipe Voucher</label>
                            <select 
                            value={newVoucher.type}
                            onChange={e => setNewVoucher({...newVoucher, type: e.target.value as any})}
                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-all ${newVoucher.type === 'Masuk' ? 'text-emerald-700 border-emerald-200 focus:ring-emerald-500/20' : 'text-rose-700 border-rose-200 focus:ring-rose-500/20'}`}
                            >
                                <option value="Masuk">KAS MASUK</option>
                                <option value="Keluar">KAS KELUAR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Buku Kas</label>
                            <select 
                            value={newVoucher.bukuKas}
                            onChange={e => setNewVoucher({...newVoucher, bukuKas: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700"
                            >
                                {kasBankList.map(k => (
                                    <option key={k.code} value={k.code}>{k.code} — {k.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Transaksi</label>
                            <DatePicker 
                            selected={newVoucher.date ? parseISO(newVoucher.date) : new Date()}
                            onChange={(date) => date && setNewVoucher({...newVoucher, date: format(date, 'yyyy-MM-dd')})}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-bold text-slate-700">Nomor Bukti</label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors">
                                <input 
                                type="checkbox" 
                                checked={isAutoNo} 
                                onChange={e => setIsAutoNo(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                Auto-number
                            </label>
                            </div>
                            <input 
                            type="text" 
                            placeholder="e.g. BKK0001"
                            value={newVoucher.no}
                            disabled={isAutoNo}
                            onChange={e => setNewVoucher({...newVoucher, no: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-slate-100"
                            />
                        </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Keterangan Voucher</label>
                    <textarea 
                      placeholder="Tuliskan keterangan lengkap..."
                      value={newVoucher.description}
                      onChange={e => setNewVoucher({...newVoucher, description: e.target.value})}
                      className="w-full flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible flex flex-col">
                  <div className="overflow-visible">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="rounded-tl-2xl px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-16 text-center">No</th>
                          <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest">Akun Lawan (Offset Account)</th>
                          <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest text-right w-64">Jumlah (Rp)</th>
                          <th className="rounded-tr-2xl px-4 py-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {newVoucher.details.map((d, index) => (
                          <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-center text-sm font-bold text-slate-400">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <AccountSelect 
                                value={d.accountId} 
                                onChange={(val) => handleDetailChange(d.id, "accountId", val)} 
                                coaList={coaList} 
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="text"
                                value={d.amount === 0 ? "" : formatCurrency(d.amount)}
                                onChange={e => handleDetailChange(d.id, "amount", e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="0"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleRemoveDetailRow(d.id)}
                                disabled={newVoucher.details.length <= 1}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                    <button 
                      onClick={handleAddDetailRow}
                      className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100/50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Tambah Baris Akun
                    </button>
                    <div className="flex gap-10 px-8">
                      <div className="text-right flex items-center gap-6">
                        <p className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mt-1">Total Transaksi :</p>
                        <p className={`text-2xl font-extrabold ${newVoucher.type === 'Masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(totalAmountForm)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white px-8 py-5 flex justify-between items-center border-t border-slate-200">
                <div className="flex-1">
                  {!isDescriptionFilledForm && (
                    <p className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      Keterangan voucher wajib diisi.
                    </p>
                  )}
                  {isDescriptionFilledForm && totalAmountForm === 0 && (
                    <p className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      Total transaksi tidak boleh 0.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsFormOpen(false)} 
                    className="px-6 py-2.5 text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  {vouchers.some(v => v.id === newVoucher.id) && (
                    <button 
                      onClick={handleDeleteVoucher}
                      className="px-4 py-2.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Hapus
                    </button>
                  )}
                  <button 
                    onClick={handleSaveVoucher}
                    disabled={!canSaveForm}
                    className="px-8 py-2.5 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Simpan Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="signature-gradient px-8 py-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Impor Excel (Voucher)</h2>
                  <p className="text-blue-100 text-sm font-medium">Tentukan baris dan validasi data sebelum disimpan.</p>
                </div>
                <button onClick={() => { setShowImportModal(false); setImportReport([]); }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* File Selection */}
                <div className="flex flex-col items-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl font-black hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined">attach_file</span>
                    {workbook ? "File Terpilih ✅" : "Pilih File Excel"}
                  </button>
                  {workbook && <p className="text-xs font-bold text-slate-500">Ditemukan {availableSheets.length} Sheet</p>}
                </div>

                {/* Config Section */}
                {workbook && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Pilih Sheet</label>
                      <select 
                        value={importConfig.selectedSheet}
                        onChange={e => setImportConfig({...importConfig, selectedSheet: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                      >
                        {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mulai dari Baris</label>
                        <input 
                          type="number" 
                          value={importConfig.startRow}
                          onChange={e => setImportConfig({...importConfig, startRow: parseInt(e.target.value) || 1})}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Sampai Baris</label>
                        <input 
                          type="number" 
                          value={importConfig.endRow}
                          onChange={e => setImportConfig({...importConfig, endRow: parseInt(e.target.value) || 1000})}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleValidateImport}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <span className="material-symbols-outlined">analytics</span>
                      Validasi & Impor Data
                    </button>
                  </div>
                )}

                {importReport.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Laporan Validasi</h3>
                    <div className="space-y-2">
                      {importReport.map((r, i) => (
                        <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 text-xs font-semibold ${
                          r.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                          r.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {r.type === 'error' ? 'error' : r.type === 'warning' ? 'warning' : 'check_circle'}
                          </span>
                          <div className="flex-grow">
                            <span className="font-black mr-2">[{r.no}]</span>
                            {r.msg}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                  onClick={() => { setShowImportModal(false); setImportReport([]); setWorkbook(null); }}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                 >
                   Tutup
                 </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
