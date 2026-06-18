import type { CustodyStatus, RepairMethod, RequesterType, Severity, UserRole } from "@prisma/client";

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const REPAIR_METHOD_LABELS: Record<RepairMethod, string> = {
  REMOTE_SUPPORT: "Remote Support",
  WALK_IN_SERVICE: "Walk-In Service",
  HARDWARE_REPAIR: "Hardware Repair",
  SOFTWARE_REPAIR: "Software Repair",
};

export const CUSTODY_STATUS_LABELS: Record<CustodyStatus, string> = {
  NOT_RECEIVED: "Not Received",
  RECEIVED: "Received",
  IN_REPAIR_ROOM: "In Repair Room",
  READY_FOR_COLLECTION: "Ready for Collection",
  COLLECTED: "Collected",
};

export const REQUESTER_TYPE_LABELS: Record<RequesterType, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  STAFF: "Staff",
  OTHER: "Other",
};

export const SERVICE_DESK_ROLE_LABELS: Partial<Record<UserRole, string>> = {
  LEAD_TECHNICIAN: "Lead Technician",
};

export const ISSUE_CATEGORY_OPTIONS = [
  "SOFTWARE_INSTALLATION",
  "OS_REINSTALL",
  "VIRUS_MALWARE",
  "PERFORMANCE_SLOW",
  "BOOT_FAILURE",
  "NETWORK_WIFI",
  "ACCOUNT_EMAIL",
  "HARDWARE_KEYBOARD",
  "HARDWARE_SCREEN",
  "HARDWARE_STORAGE",
  "HARDWARE_BATTERY",
  "OTHER",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORY_OPTIONS)[number];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  SOFTWARE_INSTALLATION: "Software Installation",
  OS_REINSTALL: "OS Reinstall",
  VIRUS_MALWARE: "Virus or Malware",
  PERFORMANCE_SLOW: "Performance Slow",
  BOOT_FAILURE: "Boot Failure",
  NETWORK_WIFI: "Network or WiFi",
  ACCOUNT_EMAIL: "Account or Email",
  HARDWARE_KEYBOARD: "Keyboard Hardware",
  HARDWARE_SCREEN: "Screen Hardware",
  HARDWARE_STORAGE: "Storage Hardware",
  HARDWARE_BATTERY: "Battery Hardware",
  OTHER: "Other",
};
