"use client";

import { useState, useEffect, useRef } from "react";

import { getJournals, saveJournals, getCOAData } from "@/lib/dataService";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import { parseRobustAmount, parseRobustDate } from "@/lib/reportUtils";

interface JournalDetail {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface Journal {
  id: string;
  date: string;
  no: string;
  description: string;
  details: JournalDetail[];
  lastEditedBy?: string;
  lastEditedAt?: string;
}

interface Account {
  code: string;
  name: string;
  level: string;
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

export default function GeneralJournal() {
  const { userData } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [coaList, setCoaList] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({ startRow: 2, endRow: 1000, selectedSheet: "" });
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isAutoNo, setIsAutoNo] = useState(true);
  const [showKasWarning, setShowKasWarning] = useState<string | null>(null);

  const generateNextNo = (currentJournals: Journal[]) => {
    const gjJournals = currentJournals.filter(j => j.no.startsWith("GJ"));
    if (gjJournals.length === 0) return "GJ0001";
    let max = 0;
    gjJournals.forEach(j => {
      const numPart = parseInt(j.no.replace("GJ", ""), 10);
      if (!isNaN(numPart) && numPart > max) max = numPart;
    });
    return `GJ${String(max + 1).padStart(4, '0')}`;
  };

  const [newJournal, setNewJournal] = useState<Journal>({
    id: "",
    date: new Date().toISOString().split('T')[0],
    no: "",
    description: "",
    details: []
  });

  useEffect(() => {
    async function loadData() {
      const data = await getJournals();
      setJournals(data);

      const coa = await getCOAData() as any;
      if (coa && coa.accounts) {
        // Only allow Rincian Akun for transactions
        setCoaList(coa.accounts.filter((a: any) => a.level === "Rincian Akun"));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleShowModal = () => {
    setNewJournal({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      no: isAutoNo ? generateNextNo(journals) : "",
      description: "",
      details: [
        { id: Date.now().toString() + "_1", accountId: "", accountName: "", debit: 0, credit: 0 },
        { id: Date.now().toString() + "_2", accountId: "", accountName: "", debit: 0, credit: 0 }
      ]
    });
    setShowKasWarning(null);
    setShowModal(true);
  };

  useEffect(() => {
    if (showModal && isAutoNo && !newJournal.no.startsWith("GJ")) {
      setNewJournal(prev => ({...prev, no: generateNextNo(journals)}));
    } else if (showModal && !isAutoNo && newJournal.no.startsWith("GJ")) {
      setNewJournal(prev => ({...prev, no: ""}));
    }
  }, [isAutoNo, showModal, journals]);

  const handleAddDetailRow = () => {
    setNewJournal(prev => ({
      ...prev,
      details: [...prev.details, { id: Date.now().toString(), accountId: "", accountName: "", debit: 0, credit: 0 }]
    }));
  };

  const handleRemoveDetailRow = (id: string) => {
    setNewJournal(prev => ({
      ...prev,
      details: prev.details.filter(d => d.id !== id)
    }));
  };

  const handleDetailChange = (id: string, field: keyof JournalDetail, value: any) => {
    setNewJournal(prev => ({
      ...prev,
      details: prev.details.map(d => {
        if (d.id === id) {
          const updated = { ...d, [field]: value };
          if (field === "accountId") {
            const acc = coaList.find(a => a.code === value);
            if (acc) {
              updated.accountName = acc.name;
              // Check if Kas/Bank
              if (value.startsWith("1-12") || acc.name.toLowerCase().includes("bank") || acc.name.toLowerCase().includes("kas")) {
                setShowKasWarning(`Akun "${acc.name}" berkaitan dengan Kas/Bank. Anda dapat pindah ke fitur Voucher Kas atau Bank untuk penginputan akun ini.`);
              }
            }
          }
          if (field === "debit") {
            updated.debit = parseFloat(value) || 0;
            if (updated.debit > 0) updated.credit = 0; // Auto clear credit if debit is filled
          }
          if (field === "credit") {
            updated.credit = parseFloat(value) || 0;
            if (updated.credit > 0) updated.debit = 0; // Auto clear debit if credit is filled
          }
          return updated;
        }
        return d;
      })
    }));
  };

  const handleSaveJournal = async () => {
    if (!newJournal.no || !newJournal.date || !newJournal.description) {
      alert("Harap isi Tanggal, Nomor, dan Keterangan!");
      return;
    }

    let totalDebit = 0;
    let totalCredit = 0;
    let validDetails = true;

    newJournal.details.forEach(d => {
      if (!d.accountId) validDetails = false;
      totalDebit += d.debit;
      totalCredit += d.credit;
    });

    if (!validDetails) {
      alert("Pastikan semua baris jurnal memiliki akun yang dipilih!");
      return;
    }

    if (totalDebit !== totalCredit) {
      alert(`Jurnal tidak balance! (Debit: ${totalDebit}, Kredit: ${totalCredit})`);
      return;
    }

    setStatusMsg("Menyimpan...");
    
    const journalToSave = {
      ...newJournal,
      lastEditedBy: userData?.displayName || "Super Admin",
      lastEditedAt: new Date().toISOString()
    };

    const existingIdx = journals.findIndex(j => j.id === newJournal.id);
    let updatedJournals;
    if (existingIdx >= 0) {
      updatedJournals = [...journals];
      updatedJournals[existingIdx] = journalToSave;
    } else {
      updatedJournals = [journalToSave, ...journals];
    }
    
    updatedJournals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const res = await saveJournals(updatedJournals);
    if (res.success) {
      setJournals(updatedJournals);
      setShowModal(false);
      setStatusMsg("Jurnal berhasil disimpan ✅");
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setStatusMsg("Gagal menyimpan ❌");
    }
  };

  const handleDeleteJournal = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus jurnal ini?")) return;
    
    const updatedJournals = journals.filter(j => j.id !== newJournal.id);
    const res = await saveJournals(updatedJournals);
    
    if (res.success) {
      setJournals(updatedJournals);
      setShowModal(false);
      setStatusMsg("Jurnal berhasil dihapus 🗑️");
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
        
        // Filter rows based on user config (1-indexed for user, 0-indexed for array)
        const headerRow = rows[0] || [];
        const dataRows = rows.slice(importConfig.startRow - 1, importConfig.endRow);
        
        if (dataRows.length === 0) {
          alert("Tidak ada data di rentang baris tersebut.");
          return;
        }

        const journalMap = new Map<string, Journal>();
        const report: any[] = [];
        const coaCodes = new Set(coaList.map(a => a.code));

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return;

          // Helper to find column index by name
          const getColIdx = (possible: string[]) => {
            return headerRow.findIndex((h: any) => 
              h && possible.some(p => String(h).toLowerCase().includes(p))
            );
          };

          const noIdx = getColIdx(["nomor", "no", "bukti"]);
          const dateIdx = getColIdx(["tanggal", "date"]);
          const descIdx = getColIdx(["keterangan", "desc"]);
          const accIdx = getColIdx(["akun", "account", "code"]);
          const debitIdx = getColIdx(["debit", "db"]);
          const creditIdx = getColIdx(["kredit", "cr", "credit"]);

          const no = noIdx >= 0 ? String(row[noIdx] || "").trim() : "";
          const dateVal = dateIdx >= 0 ? row[dateIdx] : "";
          const desc = descIdx >= 0 ? String(row[descIdx] || "") : "";
          const accCode = accIdx >= 0 ? String(row[accIdx] || "").trim() : "";
          const debit = debitIdx >= 0 ? parseRobustAmount(row[debitIdx]) : 0;
          const credit = creditIdx >= 0 ? parseRobustAmount(row[creditIdx]) : 0;

          if (!no) return;

          if (!journalMap.has(no)) {
            let parsedDate = new Date().toISOString().split('T')[0];
            if (typeof dateVal === 'number') {
              parsedDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000)).toISOString().split('T')[0];
            } else if (dateVal && !isNaN(Date.parse(dateVal))) {
              parsedDate = new Date(dateVal).toISOString().split('T')[0];
            }

            journalMap.set(no, {
              id: no + "_" + Date.now(),
              no,
              date: parsedDate,
              description: desc,
              details: [],
              lastEditedBy: userData?.displayName || "Import",
              lastEditedAt: new Date().toISOString()
            });
          }

          if (accCode) {
            const accExists = coaCodes.has(accCode);
            const acc = coaList.find(a => a.code === accCode);
            
            // Description warning logic: if desc contains keywords not in acc name, or vice versa
            let warning = "";
            if (acc && desc) {
              const descLower = desc.toLowerCase();
              const nameLower = acc.name.toLowerCase();
              // Simple check: if they share no common significant words
              const significantWords = nameLower.split(' ').filter(w => w.length > 3);
              if (significantWords.length > 0 && !significantWords.some(w => descLower.includes(w))) {
                warning = "Boleh dicek kembali terkait transaksi ini apakah sudah sesuai dengan nama akun yang diinput";
              }
            }

            if (!accExists) {
              report.push({ no, type: 'error', msg: `Akun "${accCode}" tidak ditemukan di COA.` });
            } else if (warning) {
              report.push({ no, type: 'warning', msg: `[${accCode}] ${warning}` });
            }

            journalMap.get(no)!.details.push({
              id: Date.now().toString() + Math.random(),
              accountId: accCode,
              accountName: acc?.name || "",
              debit,
              credit
            });
          }
        });

        const finalJournals: Journal[] = [];
        const validJournalsToSave: Journal[] = [];
        let hasError = false;
        const existingNos = new Set(journals.map(j => j.no));

        journalMap.forEach((j, no) => {
          const totalD = j.details.reduce((s, d) => s + d.debit, 0);
          const totalC = j.details.reduce((s, d) => s + d.credit, 0);
          const isDuplicate = existingNos.has(no);
          const hasUnknownAccount = j.details.some(d => !coaCodes.has(d.accountId));
          
          if (isDuplicate) {
            report.push({ no, type: 'error', msg: `Nomor Bukti "${no}" sudah ada di sistem (Double).` });
            hasError = true;
          } else if (Math.abs(totalD - totalC) > 0.01) {
            report.push({ no, type: 'error', msg: `Jurnal tidak balance! (D: ${totalD}, C: ${totalC})` });
            hasError = true;
          } else if (hasUnknownAccount) {
            report.push({ no, type: 'error', msg: `Terdapat akun yang tidak ditemukan.` });
            hasError = true;
          } else {
            validJournalsToSave.push(j);
            report.push({ no, type: 'success', msg: `Valid (${j.details.length} baris)` });
          }
        });

        setImportReport(report);
        
        if (hasError) {
          setStatusMsg("Impor dibatalkan karena terdapat kesalahan/data ganda. Harap perbaiki laporan di bawah. ❌");
        } else if (validJournalsToSave.length > 0) {
          const merged = [...validJournalsToSave, ...journals];
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setJournals(merged);
          await saveJournals(merged);
          setStatusMsg(`Berhasil impor ${validJournalsToSave.length} jurnal ✅`);
        } else {
          setStatusMsg("Tidak ada jurnal yang diproses ❌");
        }
        
      } catch (err) {
        console.error(err);
        setStatusMsg("Gagal memproses file ❌");
      }
  };

  const filteredJournals = journals.filter(j => {
    const jDate = new Date(j.date);
    jDate.setHours(0,0,0,0);
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);
    
    const matchDate = jDate >= start && jDate <= end;
    const matchSearch = j.no.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        j.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDate && matchSearch;
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

  const totalDebitModal = newJournal.details.reduce((sum, d) => sum + d.debit, 0);
  const totalCreditModal = newJournal.details.reduce((sum, d) => sum + d.credit, 0);
  const isBalancedModal = totalDebitModal === totalCreditModal && totalDebitModal > 0;
  const isDescriptionFilledModal = newJournal.description.trim().length > 0;
  const canSaveModal = isBalancedModal && isDescriptionFilledModal && newJournal.no.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50">


      <main className="p-8 max-w-7xl mx-auto space-y-6 pb-24">
        {!showModal ? (
          <>
            <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
                Data Jurnal
              </h1>
            </div>
            <p className="text-slate-500 font-medium mt-2 ml-12">
              Kelola transaksi General Journal untuk pencatatan akuntansi Anda.
            </p>
          </div>
          <div className="flex gap-3">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Import Excel
            </button>
            <button 
              onClick={handleShowModal}
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
          {/* Toolbar */}
          <div className="flex flex-wrap gap-6 items-end justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tanggal Mulai</label>
                <DatePicker 
                  selected={startDate}
                  onChange={(date) => setStartDate(date || new Date())}
                  dateFormat="dd/MM/yyyy"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-36"
                />
              </div>
              <div className="text-sm font-bold text-slate-400 mt-5">s/d</div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tanggal Selesai</label>
                <DatePicker 
                  selected={endDate}
                  onChange={(date) => setEndDate(date || new Date())}
                  dateFormat="dd/MM/yyyy"
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-36"
                />
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
                  className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium min-w-[300px]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-40">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-48">Nomor Bukti</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest">Keterangan</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-56 text-right">Log (Terakhir Edit)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Memuat data jurnal...</td>
                  </tr>
                ) : filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Tidak ada data transaksi yang ditemukan.</td>
                  </tr>
                ) : (
                  filteredJournals.map((j) => (
                    <tr 
                      key={j.id} 
                      onDoubleClick={() => {
                        setNewJournal(j);
                        setShowModal(true);
                      }}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      title="Klik dua kali untuk melihat / mengedit detail"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {formatDateStr(j.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{j.no}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{j.description}</td>
                      <td className="px-6 py-4 text-right text-xs text-slate-500">
                        {j.lastEditedBy ? (
                           <div className="flex flex-col items-end">
                             <span className="font-bold text-slate-700">{j.lastEditedBy}</span>
                             <span className="text-[11px] text-slate-400 mt-0.5">{formatLogTime(j.lastEditedAt)}</span>
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
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
                Form Input Jurnal
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Lengkapi rincian transaksi jurnal di bawah ini.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden flex flex-col">
            <div className="signature-gradient px-8 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-white font-extrabold text-xl tracking-tight">Detail Transaksi</h2>
                <p className="text-blue-100 text-sm font-medium mt-0.5">Pastikan total debit dan kredit seimbang (balance).</p>
              </div>
            </div>
            
            {showKasWarning && (
              <div className="mx-8 mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-amber-800">Peringatan Penggunaan Akun</p>
                  <p className="text-sm text-amber-700 mt-1">{showKasWarning}</p>
                </div>
                <button onClick={() => setShowKasWarning(null)} className="text-amber-400 hover:text-amber-600 transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            <div className="px-8 py-5 flex-grow overflow-y-auto bg-slate-50 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Transaksi</label>
                    <DatePicker 
                      selected={newJournal.date ? parseISO(newJournal.date) : new Date()}
                      onChange={(date) => date && setNewJournal({...newJournal, date: format(date, 'yyyy-MM-dd')})}
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
                      placeholder="e.g. GJ0001"
                      value={newJournal.no}
                      disabled={isAutoNo}
                      onChange={e => setNewJournal({...newJournal, no: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60 disabled:bg-slate-100"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Keterangan Jurnal</label>
                  <textarea 
                    placeholder="Tuliskan deskripsi lengkap transaksi di sini..."
                    value={newJournal.description}
                    onChange={e => setNewJournal({...newJournal, description: e.target.value})}
                    className="w-full flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible flex flex-col">
                <div className="overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="rounded-tl-2xl px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest w-72">Kode & Nama Akun</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest text-right">Debit (Rp)</th>
                        <th className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-widest text-right">Kredit (Rp)</th>
                        <th className="rounded-tr-2xl px-4 py-4 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newJournal.details.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
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
                              value={d.debit === 0 ? "" : formatCurrency(d.debit)}
                              onChange={e => handleDetailChange(d.id, "debit", e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="0"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text"
                              value={d.credit === 0 ? "" : formatCurrency(d.credit)}
                              onChange={e => handleDetailChange(d.id, "credit", e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="0"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleRemoveDetailRow(d.id)}
                              disabled={newJournal.details.length <= 2}
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
                
                {/* Detail Footer Totals */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                  <button 
                    onClick={handleAddDetailRow}
                    className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100/50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tambah Baris Akun
                  </button>
                  <div className="flex gap-10 px-8">
                    <div className="text-right">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Total Debit</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(newJournal.details.reduce((sum, d) => sum + d.debit, 0))}
                      </p>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="text-right">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Total Kredit</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(newJournal.details.reduce((sum, d) => sum + d.credit, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white px-8 py-5 flex justify-between items-center border-t border-slate-200">
              <div className="flex-1">
                {!isDescriptionFilledModal && (
                  <p className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    Keterangan jurnal wajib diisi.
                  </p>
                )}
                {isDescriptionFilledModal && !isBalancedModal && (
                  <p className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">balance</span>
                    Transaksi belum balance (selisih: {formatCurrency(Math.abs(totalDebitModal - totalCreditModal))})
                  </p>
                )}
                {isDescriptionFilledModal && isBalancedModal && (
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Transaksi balance. Siap disimpan!
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-2.5 text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                {journals.some(j => j.id === newJournal.id) && (
                  <button 
                    onClick={handleDeleteJournal}
                    className="px-4 py-2.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Hapus
                  </button>
                )}
                <button 
                  onClick={handleSaveJournal}
                  disabled={!canSaveModal}
                  className="px-8 py-2.5 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Simpan Jurnal
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
                <h2 className="text-2xl font-black tracking-tight">Impor Excel (Jurnal)</h2>
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

              {/* Validation Report */}
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
