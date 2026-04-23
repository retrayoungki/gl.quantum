"use client";

import { useState, useEffect } from "react";

import { getCompanyInfo, updateCompanyInfo } from "@/lib/dataService";

export default function CompanySetup() {

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    profile: {
      name: "",
      address: "",
      city: "",
      phone: "",
      fax: "",
      npwp16: "",
      npwpEmail: "",
      npwpPhone: "",
      kpp: "",
      director: "",
      businessType: "",
      startYear: "2025-01-01",
      endYear: "2025-12-31"
    },
    ledger: {
      diffAccountCode: "3-99999",
      diffAccountName: "Selisih Neraca",
      profitAccountCode: "3-90000",
      profitAccountName: "Laba/Rugi Tahun Berjalan"
    },
    inventory: {
      isPkp: false,
      pkpDate: "",
      pkpSeries: "",
      isJualBeli: false,
      contactPerson: "",
      position: ""
    }
  });

  useEffect(() => {
    async function loadData() {
      const data = await getCompanyInfo() as any;
      if (data) {
        setFormData(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaveStatus("Saving to Cloud...");
    const res = await updateCompanyInfo(formData) as any;
    if (res.success) {
      setSaveStatus("Synced with Cloud ✅");
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus(`Error: ${res.error || "Cloud Sync Failed"} ❌`);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white">

        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-manrope">


      <main className="p-8 max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
             <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
               <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
               <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Setup Perusahaan</h1>
               <p className="text-slate-900 font-medium mt-0.5 text-sm">Configure your company profile and general settings</p>
             </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Keluar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
            >
              Simpan Data
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            saveStatus.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <span className="material-symbols-outlined">
              {saveStatus.includes('Error') ? 'error' : 'check_circle'}
            </span>
            {saveStatus}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8">

          {/* Form Content */}
          <div className="grid grid-cols-1 gap-8 pt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4 col-span-full">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Nama Perusahaan <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="PT. Nama Perusahaan"
                        value={formData.profile.name}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, name: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="space-y-4 col-span-full">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Alamat Lengkap <span className="text-rose-500">*</span></label>
                      <textarea 
                        rows={3}
                        placeholder="Jl. Alamat Perusahaan No. 123..."
                        value={formData.profile.address}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, address: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      />
                   </div>
                   
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">NPWP (16 Digit) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        maxLength={16}
                        placeholder="0000000000000000"
                        value={formData.profile.npwp16}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, npwp16: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Email Terdaftar NPWP <span className="text-rose-500">*</span></label>
                      <input 
                        type="email" 
                        placeholder="email@perusahaan.com"
                        value={formData.profile.npwpEmail}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, npwpEmail: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">No. Telepon Terdaftar NPWP <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="021-xxxxxxx"
                        value={formData.profile.npwpPhone}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, npwpPhone: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">KPP Terdaftar <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="KPP Pratama ..."
                        value={formData.profile.kpp}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, kpp: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Nama Lengkap Direktur <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="Nama Direktur"
                        value={formData.profile.director}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, director: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Jenis Usaha <span className="text-rose-500">*</span></label>
                      <select 
                        value={formData.profile.businessType}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, businessType: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Pilih Jenis Usaha</option>
                        <option value="Perusahaan Dagang">Perusahaan Dagang</option>
                        <option value="Perusahaan Jasa">Perusahaan Jasa</option>
                        <option value="Perusahaan Manufaktur">Perusahaan Manufaktur</option>
                      </select>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Kota <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        value={formData.profile.city}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, city: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Telepon <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          value={formData.profile.phone}
                          onChange={(e) => setFormData({...formData, profile: {...formData.profile, phone: e.target.value}})}
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Fax</label>
                        <input 
                          type="text" 
                          value={formData.profile.fax}
                          onChange={(e) => setFormData({...formData, profile: {...formData.profile, fax: e.target.value}})}
                          className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Awal Tahun Fiskal <span className="text-rose-500">*</span></label>
                      <input 
                        type="date" 
                        value={formData.profile.startYear}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, startYear: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Akhir Tahun Fiskal <span className="text-rose-500">*</span></label>
                      <input 
                        type="date" 
                        value={formData.profile.endYear}
                        onChange={(e) => setFormData({...formData, profile: {...formData.profile, endYear: e.target.value}})}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}