"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/lib/menu";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const role = userData?.role || "Super Admin";

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const filteredMenuItems = menuItems.filter(section => {
    if (section.requiredRoles && !section.requiredRoles.includes(role as any)) {
      return false;
    }
    return true;
  }).map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.label === "divider") return true;
      if (item.requiredRoles && !item.requiredRoles.includes(role as any)) {
        return false;
      }
      if (item.requiredPermission && !hasPermission(role as any, item.requiredPermission)) {
        return false;
      }
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-50 bg-[#f4f3fa] dark:bg-slate-900 flex flex-col py-8 px-6 space-y-8 border-r border-outline-variant/10">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white">
          <span className="material-symbols-outlined">rocket_launch</span>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-blue-900 dark:text-white leading-tight">Q-GL Portal</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Accounting v4</p>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer">
        <span className="material-symbols-outlined text-sm">add</span>
        <span>New Entry</span>
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
        {filteredMenuItems.map((section) => (
          <div key={section.label} className="space-y-1">
            <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {section.label}
            </h3>
            {section.items.map((item, idx) => {
              if (item.label === "divider") {
                return <div key={idx} className="h-px bg-outline-variant/10 my-2 mx-3"></div>;
              }
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  className={`flex items-center space-x-3 p-3 transition-all duration-200 ease-in-out rounded-lg group ${
                    isActive
                      ? "text-[#7C3AED] bg-white editorial-shadow font-bold relative after:absolute after:right-2 after:h-4 after:w-1 after:bg-[#7C3AED] after:rounded-full"
                      : "text-slate-500 hover:text-blue-800 hover:bg-white/60 font-medium"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive ? 'text-[#7C3AED]' : 'text-slate-400 group-hover:text-blue-800'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-1">
        <Link href="#" className="flex items-center space-x-3 p-3 text-slate-500 font-medium hover:text-blue-800 hover:bg-white/40 transition-colors rounded-lg group">
          <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-800">help</span>
          <span className="text-sm">Help Center</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 text-error font-medium hover:bg-error-container/20 transition-colors rounded-lg group cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
