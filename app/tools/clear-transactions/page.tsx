"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { saveJournals, saveVouchers } from "@/lib/dataService";

export default function ClearTransactions() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleClear = async (type: "all" | "vouchers" | "journals") => {
    let message = "";
    if (type === "all") message = "SEMUA transaksi (Voucher & Jurnal)";
    if (type === "vouchers") message = "seluruh Voucher Kas/Bank";
    if (type === "journals") message = "seluruh Jurnal Umum";

    if (!confirm(`Apakah Anda yakin ingin menghapus ${message}? Tindakan ini tidak dapat dibatalkan.`)) return;

    setLoading(true);
    setStatus("Sedang menghapus data...");

    try {
      if (type === "all" || type === "vouchers") {
        await saveVouchers([]);
      }
      if (type === "all" || type === "journals") {
        await saveJournals([]);
      }
      
      setStatus(`Berhasil menghapus ${message} ✅`);
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error(error);
      setStatus("Gagal menghapus data ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="p-12 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-manrope">Hapus Transaksi</h1>
          <p className="text-slate-500 font-medium mt-2">
            Gunakan fitur ini untuk membersihkan transaksi yang salah atau ingin memulai pembukuan dari awal.
          </p>
        </div>

        {status && (
          <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <span className="material-symbols-outlined text-sm">info</span>
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: All */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-xl hover:border-red-200 transition-all group">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">delete_sweep</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Semua Transaksi</h3>
              <p className="text-xs text-slate-500 mt-2">Hapus seluruh isi Voucher dan Jurnal Umum sekaligus.</p>
            </div>
            <button 
              onClick={() => handleClear("all")}
              disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Hapus Semua
            </button>
          </div>

          {/* Card 2: Vouchers */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">savings</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hanya Voucher</h3>
              <p className="text-xs text-slate-500 mt-2">Hapus seluruh catatan Kas & Bank saja.</p>
            </div>
            <button 
              onClick={() => handleClear("vouchers")}
              disabled={loading}
              className="w-full py-2.5 border border-orange-200 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              Hapus Voucher
            </button>
          </div>

          {/* Card 3: Journals */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4 hover:shadow-lg transition-all">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">edit_document</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hanya Jurnal</h3>
              <p className="text-xs text-slate-500 mt-2">Hapus seluruh catatan Jurnal Umum saja.</p>
            </div>
            <button 
              onClick={() => handleClear("journals")}
              disabled={loading}
              className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              Hapus Jurnal
            </button>
          </div>
        </div>

        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex gap-4">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div className="text-sm text-amber-800">
            <p className="font-bold">Peringatan Keamanan</p>
            <p className="mt-1">
              Data yang sudah dihapus tidak dapat dikembalikan. Fitur ini dirancang untuk membersihkan kesalahan input massal atau untuk memulai ulang pembukuan periode baru.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
