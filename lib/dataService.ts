import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getCOAData() {
  try {
    const docRef = doc(db, "settings", "coa");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching COA data:", error);
    return null;
  }
}

export async function updateCOAData(accounts: any[]) {
  try {
    const docRef = doc(db, "settings", "coa");
    await setDoc(docRef, { accounts });
    return { success: true };
  } catch (error) {
    console.error("Error updating COA data:", error);
    return { success: false, error: String(error) };
  }
}

export async function getCompanyInfo() {
  try {
    const docRef = doc(db, "settings", "company");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Default values if document doesn't exist
    return {
      profile: {
        name: "[NAMA PERUSAHAAN]",
        address: "[ALAMAT PERUSAHAAN]",
        city: "[KOTA]",
        phone: "",
        fax: "",
        npwp16: "",
        npwpEmail: "",
        npwpPhone: "",
        kpp: "",
        director: "",
        businessType: "",
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
    const docRef = doc(db, "settings", "company");
    await setDoc(docRef, info);
    return { success: true };
  } catch (error) {
    console.error("Error updating company info:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getJournals() {
  try {
    const docRef = doc(db, "transactions", "general_journals");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching journals:", error);
    return [];
  }
}

export async function saveJournals(journals: any[]) {
  try {
    const docRef = doc(db, "transactions", "general_journals");
    await setDoc(docRef, { data: journals });
    return { success: true };
  } catch (error) {
    console.error("Error updating journals:", error);
    return { success: false, error: String(error) };
  }
}
export async function getVouchers() {
  try {
    const docRef = doc(db, "transactions", "cash_bank_vouchers");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return [];
  }
}

export async function saveVouchers(vouchers: any[]) {
  try {
    const docRef = doc(db, "transactions", "cash_bank_vouchers");
    await setDoc(docRef, { data: vouchers });
    return { success: true };
  } catch (error) {
    console.error("Error updating vouchers:", error);
    return { success: false, error: String(error) };
  }
}
