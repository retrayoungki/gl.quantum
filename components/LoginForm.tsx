"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 font-inter">
      <div className="max-w-md w-full px-8 py-12 bg-white rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] border border-slate-200">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Q-GL Accounting Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = document.getElementById('login-logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div id="login-logo-fallback" className="hidden flex-col items-center gap-3">
              <div className="w-16 h-16 signature-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-manrope tracking-tight mt-2">
                Q-GL Accounting
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Please sign in to access your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-rose-600 text-sm">error</span>
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 font-medium placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 signature-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-70 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center border-t border-slate-100 pt-8">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            &copy; 2024 Q-GL ACCOUNTING PORTAL • SECURE ACCESS
          </p>
        </div>
      </div>
    </div>
  );
}
