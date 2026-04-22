export type UserRole = "Super Admin" | "Direksi" | "Manager" | "Staff";

export const ROLES: UserRole[] = ["Super Admin", "Direksi", "Manager", "Staff"];

export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedCompanies: string[]; // Array of Company IDs
  createdAt: any;
}
