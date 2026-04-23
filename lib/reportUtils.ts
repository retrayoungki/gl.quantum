import { getJournals, getVouchers, getCOAData } from "./dataService";
import { format } from "date-fns";

export interface Transaction {
  date: string;
  code: string;
  description: string;
  debit: number;
  credit: number;
  accountCode: string;
  accountName: string;
  reference?: string;
}

// Helper to parse dates in multiple formats (YYYY-MM-DD or DD/MM/YYYY)
export function parseRobustDate(dateStr: any): Date {
  if (!dateStr) return new Date(0);
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr).trim();
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str);
  
  // Try DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  
  // Try Excel Serial (numeric string)
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (num > 30000) { // Likely an Excel serial (around year 1982+)
      return new Date(Math.round((num - 25569) * 86400 * 1000));
    }
  }
  
  return new Date(str);
}

// Helper to parse amounts that might be formatted strings (e.g. "1.000.000")
export function parseRobustAmount(amount: any): number {
  if (typeof amount === 'number') return amount;
  if (!amount) return 0;
  // Remove thousands separators (dots) and replace comma with dot for decimal if needed
  const cleaned = String(amount).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const [journals, vouchers] = await Promise.all([getJournals(), getVouchers()]);
  
  const transactions: Transaction[] = [];

  // General Journals
  journals.forEach((j: any) => {
    const date = parseRobustDate(j.date).toISOString().split('T')[0];
    const details = j.details || j.entries || [];
    
    details.forEach((entry: any) => {
      transactions.push({
        date: date,
        code: j.no,
        description: j.description,
        debit: parseRobustAmount(entry.debit),
        credit: parseRobustAmount(entry.credit),
        accountCode: String(entry.accountId || entry.accountCode || "").trim(),
        accountName: entry.accountName || "",
        reference: j.no
      });
    });
  });

  // Cash/Bank Vouchers
  vouchers.forEach((v: any) => {
    const typeStr = String(v.type || "").toUpperCase();
    const isM = typeStr.includes("MASUK") || typeStr === "M";
    const date = parseRobustDate(v.date).toISOString().split('T')[0];
    
    const details = v.details || v.entries || [];
    
    details.forEach((entry: any) => {
      const amount = parseRobustAmount(entry.amount);
      if (amount === 0) return;

      // Main Account Side (Buku Kas)
      const mainAccountCode = String(v.bukuKas || v.accountCode || "").trim();
      if (mainAccountCode) {
        transactions.push({
          date: date,
          code: v.no,
          description: v.description || entry.description,
          debit: isM ? amount : 0,
          credit: !isM ? amount : 0,
          accountCode: mainAccountCode,
          accountName: v.accountName || "",
          reference: v.no
        });
      }

      // Detail Account Side (Offset Account)
      const detailAccountCode = String(entry.accountId || entry.accountCode || "").trim();
      if (detailAccountCode) {
        transactions.push({
          date: date,
          code: v.no,
          description: entry.description || v.description,
          debit: !isM ? amount : 0,
          credit: isM ? amount : 0,
          accountCode: detailAccountCode,
          accountName: entry.accountName || "",
          reference: v.no
        });
      }
    });
  });

  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAccountBalances(endDate: string) {
  const transactions = await getAllTransactions();
  const targetDate = endDate ? parseRobustDate(endDate) : new Date('2099-12-31');
  
  const balances: Record<string, { debit: number; credit: number; balance: number }> = {};

  transactions.forEach(t => {
    if (parseRobustDate(t.date) > targetDate) return;

    const code = t.accountCode;
    if (!balances[code]) {
      balances[code] = { debit: 0, credit: 0, balance: 0 };
    }
    balances[code].debit += t.debit;
    balances[code].credit += t.credit;
  });

  // Calculate final balance based on account type (Asset/Expense: D-C, Liab/Equity/Income: C-D)
  const coa = await getCOAData();
  const accounts = coa?.accounts || [];

  accounts.forEach((acc: any) => {
    const b = balances[acc.code] || { debit: 0, credit: 0, balance: 0 };
    const isDebitNormal = acc.normalBalance === "Debit";
    
    const openingBalance = acc.saldo || 0;
    const movement = isDebitNormal ? (b.debit - b.credit) : (b.credit - b.debit);
    
    b.balance = openingBalance + movement;
    balances[acc.code] = b;
  });

  return balances;
}

export function formatCurrency(num: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
