export const STAFF_ROLES = [
  "FIRM_ADMIN",
  "ATTORNEY",
  "PARALEGAL",
  "CASE_COORDINATOR",
  "READ_ONLY",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = {
  manageFirm: ["FIRM_ADMIN"],
  manageUsers: ["FIRM_ADMIN"],
  manageBilling: ["FIRM_ADMIN"],
  manageTemplates: ["FIRM_ADMIN"],
  manageSettings: ["FIRM_ADMIN"],
  mutateCases: ["FIRM_ADMIN", "ATTORNEY", "PARALEGAL", "CASE_COORDINATOR"],
  reviewDocuments: ["FIRM_ADMIN", "ATTORNEY", "PARALEGAL"],
  generateAi: ["FIRM_ADMIN", "ATTORNEY", "PARALEGAL"],
  approveAi: ["FIRM_ADMIN", "ATTORNEY"],
  viewAudit: ["FIRM_ADMIN", "READ_ONLY", "ATTORNEY"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission) {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}
