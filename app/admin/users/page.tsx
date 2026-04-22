"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/auth"; // We will use firestore, auth is client side
import { db } from "@/lib/firebase";
import { UserData, ROLES, UserRole, Company } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";

export default function UserManagementPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For the sake of the UI, we'll mock some companies if they aren't available globally
  const availableCompanies: Company[] = [
    { id: "1", name: "PT Quantum Solutions", code: "QTS" },
    { id: "2", name: "PT Global Logistics", code: "GL" },
    { id: "3", name: "PT Alpha Dynamics", code: "AD" }
  ];

  useEffect(() => {
    // Check if super admin
    if (userData?.role !== "Super Admin") return;

    // Fetch users (Mocked for now since we don't have Admin SDK to list all auth users, 
    // we assume we have a 'users' collection in Firestore)
    const fetchUsers = async () => {
      // In a real implementation:
      // const usersSnapshot = await getDocs(collection(db, "users"));
      // const usersList = usersSnapshot.docs.map(doc => doc.data() as UserData);
      
      // Mock data
      setUsers([
        { uid: "1", email: "admin@quantum.com", displayName: "System Admin", role: "Super Admin", assignedCompanies: ["1", "2", "3"], createdAt: new Date() },
        { uid: "2", email: "director@quantum.com", displayName: "John Director", role: "Direksi", assignedCompanies: ["1", "2"], createdAt: new Date() },
        { uid: "3", email: "manager@quantum.com", displayName: "Jane Manager", role: "Manager", assignedCompanies: ["1"], createdAt: new Date() },
        { uid: "4", email: "staff@quantum.com", displayName: "Bob Staff", role: "Staff", assignedCompanies: ["2"], createdAt: new Date() },
      ]);
      setLoading(false);
    };

    fetchUsers();
  }, [userData]);

  if (userData?.role !== "Super Admin") {
    return (
      <div className="p-8 flex justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          <h2 className="font-bold">Access Denied</h2>
          <p className="text-sm">Only Super Admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-manrope">
            User Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage roles and company access for all personnel
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Companies</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.displayName}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'Direksi' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'Manager' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.assignedCompanies.map(compId => {
                        const comp = availableCompanies.find(c => c.id === compId);
                        return (
                          <span key={compId} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-600">
                            {comp?.code || compId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 transition-colors ml-1">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
