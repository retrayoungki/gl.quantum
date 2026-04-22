"use server";

import { db } from "./firebaseAdmin";

export async function getCOAData() {
  try {
    const doc = await db.collection("settings").doc("coa").get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching COA data:", error);
    return null;
  }
}

export async function updateCOAData(accounts: any[]) {
  try {
    await db.collection("settings").doc("coa").set({ accounts });
    return { success: true };
  } catch (error) {
    console.error("Error updating COA data:", error);
    return { success: false, error: String(error) };
  }
}

export async function getCompanyInfo() {
  try {
    const doc = await db.collection("settings").doc("company").get();
    if (doc.exists) {
      return doc.data();
    }
    // Default values if document doesn't exist
    return {
      profile: {
        name: "[NAMA PERUSAHAAN]",
        address: "[ALAMAT PERUSAHAAN]",
        city: "[KOTA]",
        phone: "",
        fax: "",
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
        npwp: "",
        isPkp: false,
        pkpDate: "",
        pkpSeries: "",
        isJualBeli: false,
        contactPerson: "",
        position: ""
      }
    };
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}

export async function updateCompanyInfo(info: any) {
  try {
    await db.collection("settings").doc("company").set(info);
    return { success: true };
  } catch (error) {
    console.error("Error updating company info:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
