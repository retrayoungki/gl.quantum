"use client";

import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/LoginForm";
import { usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing Security...</p>
        </div>
      </div>
    );
  }

  // Allow access to the init page without authentication
  if (!user && pathname !== '/init') {
    return <LoginForm />;
  }

  return <>{children}</>;
}
