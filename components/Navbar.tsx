"use client";

import { useState } from "react";
import Link from "next/link";
import { menuItems } from "@/lib/menu";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { useCompany } from "@/context/CompanyContext";

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { userData } = useAuth();
  const role = userData?.role || "Super Admin"; // Fallback to Super Admin for development
  const { activeCompany, availableCompanies, setActiveCompany } = useCompany();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Filter menu items based on user role and permissions
  const filteredMenuItems = menuItems.filter(section => {
    // Check section level roles
    if (section.requiredRoles && !section.requiredRoles.includes(role as any)) {
      return false;
    }
    return true;
  }).map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Check item level roles
      if (item.requiredRoles && !item.requiredRoles.includes(role as any)) {
        return false;
      }
      // Check item level permissions
      if (item.requiredPermission && !hasPermission(role as any, item.requiredPermission)) {
        return false;
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="h-16 flex justify-between items-center px-8 border-b border-slate-50/50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Q-GL Accounting Logo" 
                className="h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="logo-fallback" className="hidden items-center gap-3">
                <div className="w-9 h-9 signature-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900 leading-tight font-manrope hidden sm:block">
                  Q-GL
                </div>
              </div>
            </div>
          </Link>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

          {/* Company Switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              disabled={availableCompanies.length <= 1}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold transition-all ${availableCompanies.length > 1 ? 'hover:bg-slate-100 hover:border-slate-300 cursor-pointer' : 'opacity-80 cursor-default'}`}
            >
              <span className="material-symbols-outlined text-slate-500 text-sm">business</span>
              <span className="max-w-[120px] truncate">{activeCompany?.name || "No Company"}</span>
              {availableCompanies.length > 1 && (
                <span className="material-symbols-outlined text-slate-400 text-sm ml-1">unfold_more</span>
              )}
            </button>

            {showCompanyDropdown && availableCompanies.length > 1 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  Select Company
                </div>
                {availableCompanies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setActiveCompany(company);
                      setShowCompanyDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors flex flex-col ${activeCompany?.id === company.id ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'}`}
                  >
                    <span>{company.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{company.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* View Only Indicator */}
          {role && !["Super Admin", "Manager"].includes(role) && (
            <div className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600">
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              <span className="text-xs font-bold uppercase tracking-wide">View Only</span>
            </div>
          )}

          <nav className="flex items-center ml-4">
            {filteredMenuItems.map((menu) => (
              <div
                key={menu.label}
                className="relative group px-1"
                onMouseEnter={() => setActiveDropdown(menu.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-all">
                  <span>{menu.label}</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>

                <div className="absolute left-0 mt-0 pt-2 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden py-2 backdrop-blur-xl ring-1 ring-black/5">
                    {menu.items.map((item, idx) => (
                      item.label === "divider" ? (
                        <div key={idx} className="h-px bg-slate-100 my-1 mx-2"></div>
                      ) : (
                        <Link
                          key={item.label}
                          href={item.href || "#"}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                            item.type === "error"
                              ? "text-red-500 hover:bg-red-50"
                              : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center mr-2">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-sm">
              search
            </span>
            <input
              className="bg-slate-100 border-none rounded-full pl-10 pr-4 py-1.5 text-sm w-48 focus:w-64 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="Search..."
              type="text"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 active:scale-95 duration-150 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
          
          <button 
            onClick={handleLogout}
            className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
          
          <div className="flex items-center gap-3 ml-2">
            <img
              alt="User Profile"
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
