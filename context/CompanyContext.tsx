"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Company } from "@/lib/roles";
import { useAuth } from "./AuthContext";
import { getCompanyInfo } from "@/lib/dataService";

interface CompanyContextType {
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  availableCompanies: Company[];
  loadingCompanies: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  activeCompany: null,
  setActiveCompany: () => {},
  availableCompanies: [],
  loadingCompanies: true,
});

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { userData } = useAuth();
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const info = await getCompanyInfo();
        if (info && info.profile && info.profile.name) {
          const mainCompany: Company = {
            id: "1",
            name: info.profile.name,
            code: "CMP-01"
          };
          setAvailableCompanies([mainCompany]);
          setActiveCompany(mainCompany);
        } else {
          const defaultCompany: Company = {
            id: "1",
            name: "[NAMA PERUSAHAAN]",
            code: "CMP-01"
          };
          setAvailableCompanies([defaultCompany]);
          setActiveCompany(defaultCompany);
        }
      } catch (error) {
        console.error("Failed to load company:", error);
      } finally {
        setLoadingCompanies(false);
      }
    }
    
    if (userData) {
      fetchCompany();
    } else {
      setAvailableCompanies([]);
      setActiveCompany(null);
      setLoadingCompanies(false);
    }
  }, [userData]);

  return (
    <CompanyContext.Provider value={{ activeCompany, setActiveCompany, availableCompanies, loadingCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
