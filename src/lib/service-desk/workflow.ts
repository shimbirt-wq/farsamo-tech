import type { CustodyStatus, RepairMethod, UserRole } from "@prisma/client";

const ALLOWED_CUSTODY_TRANSITIONS: ReadonlyMap<CustodyStatus, readonly CustodyStatus[]> = new Map([
  ["NOT_RECEIVED", ["RECEIVED"]],
  ["RECEIVED", ["IN_REPAIR_ROOM"]],
  ["IN_REPAIR_ROOM", ["READY_FOR_COLLECTION"]],
  ["READY_FOR_COLLECTION", ["COLLECTED"]],
  ["COLLECTED", []],
]);

const PHYSICAL_CUSTODY_REPAIR_METHODS = new Set<RepairMethod>(["WALK_IN_SERVICE", "HARDWARE_REPAIR", "SOFTWARE_REPAIR"]);

export type ServiceDeskUser = {
  id: string;
  role: UserRole;
};

export type AssignedServiceDeskTicket = {
  technicianId: string | null;
};

export function canTransitionCustody(from: CustodyStatus, to: CustodyStatus): boolean {
  return ALLOWED_CUSTODY_TRANSITIONS.get(from)?.includes(to) ?? false;
}

export function isFinalCustodyStatus(status: CustodyStatus): boolean {
  return status === "COLLECTED";
}

export function requiresPhysicalCustody(repairMethod: RepairMethod): boolean {
  return PHYSICAL_CUSTODY_REPAIR_METHODS.has(repairMethod);
}

export function canTechnicianWorkOnTicket(user: ServiceDeskUser, ticket: AssignedServiceDeskTicket): boolean {
  if (user.role === "ADMIN" || user.role === "LEAD_TECHNICIAN") {
    return true;
  }

  return user.role === "TECHNICIAN" && ticket.technicianId === user.id;
}
