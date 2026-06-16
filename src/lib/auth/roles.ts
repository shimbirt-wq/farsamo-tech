import type { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  TECHNICIAN: "Technician",
  ADMIN: "Admin",
};

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isTechnician(role: UserRole): boolean {
  return role === "TECHNICIAN";
}

export function canManageTickets(role: UserRole): boolean {
  return role === "ADMIN" || role === "TECHNICIAN";
}
