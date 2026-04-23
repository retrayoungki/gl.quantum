import { UserRole } from "./roles";
import { Permission } from "./permissions";

export interface MenuItem {
  label: string;
  icon?: string;
  type?: "error";
  href?: string;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
}

export interface MenuSection {
  label: string;
  items: MenuItem[];
  requiredRoles?: UserRole[];
}

export const menuItems: MenuSection[] = [
  {
    label: "Setup",
    requiredRoles: ["Super Admin", "Direksi"],
    items: [
      { label: "Data Perusahaan", icon: "domain", href: "/setup/company" },
      { label: "Chart of Account", icon: "account_tree", href: "/coa", requiredPermission: "manage_coa" },
      { label: "Saldo Awal Account", icon: "account_balance_wallet", href: "/setup/beginning-balance" },
      { label: "Relasi Acc. - Inventory", icon: "inventory_2" },
      { label: "Buku KAS/BANK", icon: "savings" },
      { label: "Objek Pajak", icon: "receipt_long" },
      { label: "Proyek", icon: "assignment" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { label: "Input: General Journal", icon: "edit_document", href: "/accounting/general-journal", requiredRoles: ["Super Admin", "Manager", "Staff"] },
      { label: "Input: Voucher KAS/BANK", icon: "confirmation_number", href: "/accounting/cash-bank-voucher", requiredRoles: ["Super Admin", "Manager", "Staff"] },
      { label: "divider" },
      { label: "Output: Neraca", icon: "account_balance", href: "/reports/balance-sheet", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Laba/Rugi", icon: "trending_up", href: "/reports/profit-loss", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Trial Balance", icon: "rule", href: "/reports/trial-balance", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: General Ledger", icon: "book", href: "/reports/general-ledger", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Journal Transaksi", icon: "history", href: "/reports/journal", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Laporan Arus Kas", icon: "show_chart", href: "/reports/cash-flow", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Buku KAS/BANK", icon: "request_quote", href: "/reports/cash-bank-ledger", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
      { label: "Output: Kartu Hutang/Piutang", icon: "credit_card", requiredRoles: ["Super Admin", "Direksi", "Manager"] },
    ],
  },
  {
    label: "Tools",
    requiredRoles: ["Super Admin"],
    items: [
      { label: "Setup Admin", icon: "admin_panel_settings" },
      { label: "divider" },
      { label: "Buat Buku Tahun Baru", icon: "library_add" },
      { label: "Hapus Transaksi", icon: "delete_sweep", href: "/tools/clear-transactions" },
    ],
  },
  {
    label: "Help",
    items: [{ label: "Contact Admin", icon: "support_agent" }],
  },
];
