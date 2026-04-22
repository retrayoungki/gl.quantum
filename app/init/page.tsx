"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function InitSuperAdmin() {
  const [status, setStatus] = useState<string>("Ready to initialize");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setStatus("Creating auth user...");
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        "retrayoungki@gmail.com", 
        "Chester100877"
      );
      
      const user = userCredential.user;
      setStatus("User created. Saving profile to Firestore...");

      // 2. Create Firestore Document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: "Retra Permana",
        role: "Super Admin",
        assignedCompanies: ["1", "2", "3"], // Mock company IDs so they have access
        createdAt: serverTimestamp()
      });

      setStatus("Success! Super Admin account created and saved. You are now logged in as this user.");
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Initialize Super Admin</h1>
          <p className="text-slate-500 text-sm mt-2">
            This will create the following account in Firebase Auth and Firestore:
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2">
          <p><span className="font-bold text-slate-700">Email:</span> retrayoungki@gmail.com</p>
          <p><span className="font-bold text-slate-700">Password:</span> Chester100877</p>
          <p><span className="font-bold text-slate-700">Name:</span> Retra Permana</p>
          <p><span className="font-bold text-slate-700">Role:</span> Super Admin</p>
        </div>

        <button 
          onClick={handleCreate}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
        >
          {loading ? "Processing..." : "Create Account"}
        </button>

        <div className={`text-sm font-medium p-3 rounded-lg ${status.includes('Success') ? 'bg-emerald-50 text-emerald-700' : status.includes('Error') ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
          {status}
        </div>
      </div>
    </div>
  );
}
