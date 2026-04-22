"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { userData } = useAuth();
  const role = userData?.role || "Super Admin"; // Fallback to Super Admin for development

  // --- Render logic based on Role ---

  const renderSuperAdminOrDireksi = () => (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
            Financial Overview
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Fiscal Year 2024 • Q3 Performance
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
            <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
            <span className="text-sm font-semibold text-slate-700">Last 30 Days</span>
            <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
          </div>
          <button className="bg-slate-50 p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 border border-slate-200">
            <span className="material-symbols-outlined">file_download</span>
          </button>
        </div>
      </div>

      {/* Metric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-8 rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold">+12.5%</span>
          </div>
          <div>
            <p className="text-slate-500 font-semibold text-sm tracking-wide uppercase">Total Revenue</p>
            <h2 className="text-4xl font-extrabold font-headline mt-1 tracking-tight text-slate-900">Rp. 428.940,-</h2>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-8 rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-50 rounded-xl">
              <span className="material-symbols-outlined text-rose-600" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            </div>
            <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-xs font-bold">+4.2%</span>
          </div>
          <div>
            <p className="text-slate-500 font-semibold text-sm tracking-wide uppercase">Operating Expenses</p>
            <h2 className="text-4xl font-extrabold font-headline mt-1 tracking-tight text-slate-900">Rp. 184.200,-</h2>
          </div>
        </div>

        {/* Net Income Card */}
        <div className="signature-gradient p-8 rounded-xl shadow-[0_24px_48px_-12px_rgba(0,80,212,0.15)] flex flex-col justify-between min-h-[180px] text-white border border-blue-600/20">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold">Stable</span>
          </div>
          <div>
            <p className="text-blue-100 font-semibold text-sm tracking-wide uppercase">Net Income</p>
            <h2 className="text-4xl font-extrabold font-headline mt-1 tracking-tight">Rp. 244.739,-</h2>
          </div>
        </div>
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Financial Pulse Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold font-headline text-slate-900">Financial Pulse</h3>
              <p className="text-slate-500 text-sm">Monthly cash flow & expenditure projection</p>
            </div>
          </div>
          <div className="p-8 h-[360px] relative bg-slate-50/20 flex items-center justify-center">
            <p className="text-slate-400 font-medium italic">Chart visualization active for Direksi & Admin</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold font-headline text-slate-900">Recent Transactions</h3>
            <a className="text-blue-600 text-xs font-bold hover:underline" href="#">View All</a>
          </div>
          <div className="flex-grow p-4 space-y-2">
            <div className="p-4 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-4 group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">AZ</div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-900">Amazon Web Services</p>
                <p className="text-xs text-slate-500">Cloud Infrastructure • 2h ago</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-600">-Rp. 1.420,-</p>
              </div>
            </div>
            <div className="p-4 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">GS</div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-900">Global Solutions Ltd.</p>
                <p className="text-xs text-slate-500">Service Invoice #884 • 5h ago</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">+Rp. 12.850,-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManager = () => (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
            Manager Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Operational Overview & Approvals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pending Approvals</h3>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">5 Action Required</span>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Purchase Request #1029</p>
                <p className="text-xs text-slate-500">Requested by IT Dept</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-100">Review</button>
                <button className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Approve</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Department Budget</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">Marketing</span>
                <span className="text-slate-500">65% Used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-[65%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">Operations</span>
                <span className="text-slate-500">82% Used</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full w-[82%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
            My Workspace
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Quick Actions & Recent Entries
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all group text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">edit_document</span>
          </div>
          <span className="font-bold text-slate-700 text-sm">New Journal Entry</span>
        </button>
        <button className="p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all group text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <span className="font-bold text-slate-700 text-sm">Upload Receipt</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">My Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-slate-500 text-sm">
          No recent activity to display.
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface">
        {['Super Admin', 'Direksi'].includes(role) && renderSuperAdminOrDireksi()}
        {role === 'Manager' && renderManager()}
        {role === 'Staff' && renderStaff()}
      </main>
    </>
  );
}