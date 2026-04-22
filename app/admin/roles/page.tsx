"use client";

import { useState } from "react";
import { UserRole, ROLES } from "@/lib/roles";
import { Permission } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";

// Define the available permissions to display in the matrix
const PERMISSIONS_LIST: { id: Permission; label: string; module: string }[] = [
  { id: "view_dashboard", label: "View Dashboard", module: "Dashboard" },
  { id: "view_reports", label: "View Reports", module: "Reports" },
  { id: "manage_setup", label: "Manage Company Setup", module: "Setup" },
  { id: "manage_coa", label: "Manage Chart of Accounts", module: "Accounting" },
  { id: "approve_transactions", label: "Approve Transactions", module: "Accounting" },
  { id: "edit_financials", label: "Edit Financial Records", module: "Accounting" },
  { id: "manage_users", label: "Manage Users & Roles", module: "System" },
];

export default function RolePermissionsPage() {
  const { userData } = useAuth();
  
  // Mocking current permissions state (in a real app, this comes from Firestore `role_permissions` collection)
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Permission[]>>({
    "Super Admin": ["view_dashboard", "view_reports", "manage_setup", "manage_coa", "approve_transactions", "edit_financials", "manage_users"],
    "Direksi": ["view_dashboard", "view_reports", "manage_setup"],
    "Manager": ["view_dashboard", "view_reports", "approve_transactions"],
    "Staff": ["view_dashboard"]
  });

  if (userData?.role !== "Super Admin") {
    return (
      <div className="p-8 flex justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <h2 className="font-bold">Access Denied</h2>
          <p className="text-sm">Only Super Admins can manage role permissions.</p>
        </div>
      </div>
    );
  }

  const togglePermission = (role: UserRole, permission: Permission) => {
    setRolePermissions(prev => {
      const currentPerms = prev[role] || [];
      const hasPerm = currentPerms.includes(permission);
      
      return {
        ...prev,
        [role]: hasPerm 
          ? currentPerms.filter(p => p !== permission) 
          : [...currentPerms, permission]
      };
    });
  };

  const handleSave = () => {
    // In a real app, save `rolePermissions` back to Firestore
    alert("Permissions saved successfully! (Mock)");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
            Role & Permissions Matrix
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure granular access control for each system role
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Save Configuration
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-sm font-bold text-slate-500 uppercase tracking-wider w-[250px] border-r border-slate-200">
                  Permission / Module
                </th>
                {ROLES.map(role => (
                  <th key={role} className="p-4 text-center border-r border-slate-200 last:border-r-0">
                    <div className="font-bold text-slate-900">{role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(
                // Group permissions by module for cleaner UI
                PERMISSIONS_LIST.reduce((acc, perm) => {
                  acc[perm.module] = acc[perm.module] || [];
                  acc[perm.module].push(perm);
                  return acc;
                }, {} as Record<string, typeof PERMISSIONS_LIST>)
              ).map(([moduleName, permissions]) => (
                <React.Fragment key={moduleName}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={ROLES.length + 1} className="p-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                      {moduleName} Module
                    </td>
                  </tr>
                  {permissions.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 border-r border-slate-100">
                        <div className="font-semibold text-slate-700">{perm.label}</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">{perm.id}</div>
                      </td>
                      {ROLES.map(role => {
                        const isSuperAdmin = role === "Super Admin";
                        const isChecked = rolePermissions[role]?.includes(perm.id);
                        
                        return (
                          <td key={`${role}-${perm.id}`} className="p-4 text-center border-r border-slate-100 last:border-r-0">
                            <label className={`relative inline-flex items-center cursor-pointer ${isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isChecked}
                                disabled={isSuperAdmin}
                                onChange={() => togglePermission(role, perm.id)}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
