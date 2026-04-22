import { UserRole } from "./roles";

export type Permission = 
  | "view_dashboard"
  | "view_reports"
  | "manage_setup"
  | "manage_coa"
  | "approve_transactions"
  | "edit_financials"
  | "manage_users";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  "Super Admin": [
    "view_dashboard",
    "view_reports",
    "manage_setup",
    "manage_coa",
    "approve_transactions",
    "edit_financials",
    "manage_users"
  ],
  "Direksi": [
    "view_dashboard",
    "view_reports",
    "manage_setup"
  ],
  "Manager": [
    "view_dashboard",
    "view_reports",
    "approve_transactions"
  ],
  "Staff": [
    "view_dashboard"
  ]
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

export const canAccessModule = (role: UserRole | undefined, module: string): boolean => {
  if (!role) return false;
  if (role === "Super Admin") return true;

  switch (module) {
    case "coa":
      return ["Super Admin", "Manager"].includes(role);
    case "reports":
      return ["Super Admin", "Direksi", "Manager"].includes(role);
    case "setup":
      return ["Super Admin", "Direksi"].includes(role);
    default:
      return true;
  }
};
