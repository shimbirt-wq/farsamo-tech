import { Prisma, type CustodyStatus, type RepairEventType, type RepairMethod, type RepairStatus, type Severity, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { canTransitionRepairStatus, REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { createNotificationForTicketEvent } from "@/lib/service-desk/notifications";
import { canTechnicianWorkOnTicket } from "@/lib/service-desk/workflow";
import {
  studentActionRequestInputSchema,
  technicianRepairNoteInputSchema,
  technicianStatusUpdateInputSchema,
  type StudentActionRequestInput,
  type TechnicianRepairNoteInput,
  type TechnicianStatusUpdateInput,
} from "@/lib/service-desk/validations";

type TechnicianWorkspaceErrorStatus = 403 | 404 | 409;

export type TechnicianQueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: RepairStatus;
  severity: Severity | null;
  repairMethod: RepairMethod | null;
  issueCategory: string | null;
  createdAt: Date;
  assignedAt: Date | null;
  requester: {
    fullName: string | null;
    requesterType: string | null;
    universityId: string | null;
    faculty: string | null;
    department: string | null;
  };
  device: {
    deviceType: string;
    brand: string;
    model: string;
  };
};

export type TechnicianTicketDetail = TechnicianQueueTicket & {
  issueDescription: string;
  studentActionRequired: string | null;
  partRequirement: string | null;
  requester: TechnicianQueueTicket["requester"] & {
    phone: string | null;
    email: string | null;
  };
  device: TechnicianQueueTicket["device"] & {
    id: string;
    serialNumber: string | null;
    assetTag: string | null;
    description: string | null;
  };
  custody: {
    id: string;
    status: CustodyStatus;
    receivedAt: Date | null;
    condition: string | null;
    accessories: Prisma.JsonValue;
    storageLocation: string | null;
    readyForCollectionAt: Date | null;
    collectedAt: Date | null;
  } | null;
  events: Array<{
    id: string;
    eventType: RepairEventType;
    actorRole: UserRole | null;
    statusFrom: string | null;
    statusTo: string | null;
    note: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    actor: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null;
  }>;
};

export type TechnicianWorkspaceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: TechnicianWorkspaceErrorStatus;
      message: string;
    };

type TechnicianWorkspaceError = Extract<TechnicianWorkspaceResult<never>, { ok: false }>;

export class TechnicianWorkspaceValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid technician workspace data.");
    this.name = "TechnicianWorkspaceValidationError";
  }
}

const TECHNICIAN_PROGRESS_STATUSES = new Set<RepairStatus>([
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
]);

const staffUserSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  fullName: true,
  email: true,
  role: true,
});

const technicianQueueTicketSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  ticketId: true,
  trackingCode: true,
  status: true,
  severity: true,
  repairMethod: true,
  issueCategory: true,
  createdAt: true,
  assignedAt: true,
  requester: {
    select: {
      fullName: true,
      requesterType: true,
      universityId: true,
      faculty: true,
      department: true,
    },
  },
  device: {
    select: {
      deviceType: true,
      brand: true,
      model: true,
    },
  },
});

const technicianTicketDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  ...technicianQueueTicketSelect,
  technicianId: true,
  issueDescription: true,
  studentActionRequired: true,
  partRequirement: true,
  requester: {
    select: {
      fullName: true,
      requesterType: true,
      universityId: true,
      faculty: true,
      department: true,
      phone: true,
      email: true,
    },
  },
  device: {
    select: {
      id: true,
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
      assetTag: true,
      description: true,
    },
  },
  custody: {
    select: {
      id: true,
      status: true,
      receivedAt: true,
      condition: true,
      accessories: true,
      storageLocation: true,
      readyForCollectionAt: true,
      collectedAt: true,
    },
  },
  events: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      eventType: true,
      actorRole: true,
      statusFrom: true,
      statusTo: true,
      note: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: staffUserSummarySelect,
      },
    },
  },
});

type TechnicianQueueTicketRecord = Prisma.RepairTicketGetPayload<{ select: typeof technicianQueueTicketSelect }>;
type TechnicianTicketDetailRecord = Prisma.RepairTicketGetPayload<{ select: typeof technicianTicketDetailSelect }>;

function buildTicketLookupFilter(ticketIdOrTrackingCode: string) {
  return {
    OR: [
      { id: ticketIdOrTrackingCode },
      { ticketId: ticketIdOrTrackingCode },
      { trackingCode: ticketIdOrTrackingCode },
    ],
  };
}

function toRequesterSummary(requester: TechnicianQueueTicketRecord["requester"]): TechnicianQueueTicket["requester"] {
  return {
    fullName: requester?.fullName ?? null,
    requesterType: requester?.requesterType ?? null,
    universityId: requester?.universityId ?? null,
    faculty: requester?.faculty ?? null,
    department: requester?.department ?? null,
  };
}

function toQueueTicket(ticket: TechnicianQueueTicketRecord): TechnicianQueueTicket {
  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    trackingCode: ticket.trackingCode,
    status: ticket.status,
    severity: ticket.severity,
    repairMethod: ticket.repairMethod,
    issueCategory: ticket.issueCategory,
    createdAt: ticket.createdAt,
    assignedAt: ticket.assignedAt,
    requester: toRequesterSummary(ticket.requester),
    device: ticket.device,
  };
}

function toTicketDetail(ticket: TechnicianTicketDetailRecord): TechnicianTicketDetail {
  return {
    ...toQueueTicket(ticket),
    requester: {
      ...toRequesterSummary(ticket.requester),
      phone: ticket.requester?.phone ?? null,
      email: ticket.requester?.email ?? null,
    },
    device: ticket.device,
    issueDescription: ticket.issueDescription,
    studentActionRequired: ticket.studentActionRequired,
    partRequirement: ticket.partRequirement,
    custody: ticket.custody,
    events: ticket.events,
  };
}

async function findTicketForAccess(ticketIdOrTrackingCode: string) {
  return prisma.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: technicianTicketDetailSelect,
  });
}

async function findTicketForMutation(tx: Prisma.TransactionClient, ticketIdOrTrackingCode: string) {
  return tx.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: {
      id: true,
      ticketId: true,
      trackingCode: true,
      status: true,
      technicianId: true,
    },
  });
}

function ensureTicketAccess(user: PublicUser, ticket: { technicianId: string | null }): TechnicianWorkspaceError | null {
  if (canTechnicianWorkOnTicket(user, ticket)) {
    return null;
  }

  return {
    ok: false,
    status: 403,
    message: "You can only access tickets assigned to you.",
  };
}

function validateTechnicianStatusTransition(current: RepairStatus, next: RepairStatus): TechnicianWorkspaceError | null {
  if (!TECHNICIAN_PROGRESS_STATUSES.has(next)) {
    return {
      ok: false,
      status: 409,
      message: "Technicians can only move tickets through diagnosis, repair, and quality inspection.",
    };
  }

  if (!canTransitionRepairStatus(current, next)) {
    return {
      ok: false,
      status: 409,
      message: "Technician status updates must follow the next repair progress step.",
    };
  }

  return null;
}

function buildRepairNote(input: TechnicianRepairNoteInput) {
  return [input.diagnosis ? `Diagnosis: ${input.diagnosis}` : null, input.repairNotes ? `Repair note: ${input.repairNotes}` : null]
    .filter(Boolean)
    .join("\n");
}

export async function listTechnicianQueue(userId: string): Promise<TechnicianQueueTicket[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      technicianId: userId,
      status: { not: "DEVICE_COLLECTED" },
    },
    select: technicianQueueTicketSelect,
    orderBy: [{ assignedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  return tickets.map(toQueueTicket);
}

export async function getTechnicianTicket(
  userId: string,
  ticketIdOrTrackingCode: string,
  actorRole: UserRole = "TECHNICIAN",
): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const ticket = await findTicketForAccess(ticketIdOrTrackingCode);

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  const accessError = ensureTicketAccess({ id: userId, role: actorRole } as PublicUser, ticket);

  if (accessError) {
    return accessError;
  }

  return {
    ok: true,
    data: toTicketDetail(ticket),
  };
}

export async function addTechnicianRepairNote(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const parsedInput = technicianRepairNoteInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new TechnicianWorkspaceValidationError(parsedInput.error);
  }

  const noteData = parsedInput.data;
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const accessError = ensureTicketAccess(input.actor, ticket);

    if (accessError) {
      return { kind: "forbidden" as const, error: accessError };
    }

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "REPAIR_NOTE_ADDED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        note: buildRepairNote(noteData),
        metadata: {
          visibility: "internal",
          diagnosis: noteData.diagnosis ?? null,
          repairNotes: noteData.repairNotes ?? null,
        },
      },
    });

    return { kind: "updated" as const, ticket: await findTicketDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(updatedTicket);
}

export async function updateTechnicianRepairStatus(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const parsedInput = technicianStatusUpdateInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new TechnicianWorkspaceValidationError(parsedInput.error);
  }

  const statusData: TechnicianStatusUpdateInput = parsedInput.data;
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const accessError = ensureTicketAccess(input.actor, ticket);

    if (accessError) {
      return { kind: "forbidden" as const, error: accessError };
    }

    const transitionError = validateTechnicianStatusTransition(ticket.status, statusData.status);

    if (transitionError) {
      return { kind: "transition-error" as const, error: transitionError };
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        status: statusData.status,
        ...(statusData.status === "QUALITY_INSPECTION" ? { completedAt: new Date() } : {}),
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "STATUS_CHANGED",
        statusFrom: ticket.status,
        statusTo: statusData.status,
        note:
          statusData.note ??
          `Status changed from ${REPAIR_STATUS_LABELS[ticket.status]} to ${REPAIR_STATUS_LABELS[statusData.status]}.`,
        metadata: {
          source: "technician_workspace",
        },
      },
    });

    return { kind: "updated" as const, ticket: await findTicketDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(updatedTicket);
}

export async function requestStudentAction(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
  data: unknown;
}): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const parsedInput = studentActionRequestInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new TechnicianWorkspaceValidationError(parsedInput.error);
  }

  const requestData: StudentActionRequestInput = parsedInput.data;
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const accessError = ensureTicketAccess(input.actor, ticket);

    if (accessError) {
      return { kind: "forbidden" as const, error: accessError };
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        studentActionRequired: requestData.studentActionRequired,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "STUDENT_ACTION_REQUESTED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        note: requestData.studentActionRequired,
        metadata: {
          notificationTodo: "WhatsApp notification will be added in a later phase.",
          visibility: "student_action",
        },
      },
    });

    return { kind: "updated" as const, ticket: await findTicketDetailInTransaction(tx, ticket.id) };
  });

  if (updatedTicket.kind === "updated" && updatedTicket.ticket) {
    await createNotificationForTicketEvent({
      ticketId: updatedTicket.ticket.id,
      eventType: "WAITING_FOR_STUDENT",
      context: {
        studentActionRequired: requestData.studentActionRequired,
      },
    }).catch(() => null);
  }

  return toMutationResult(updatedTicket);
}

export async function submitForQualityCheck(input: {
  actor: PublicUser;
  ticketIdOrTrackingCode: string;
}): Promise<TechnicianWorkspaceResult<TechnicianTicketDetail>> {
  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return { kind: "not-found" as const };
    }

    const accessError = ensureTicketAccess(input.actor, ticket);

    if (accessError) {
      return { kind: "forbidden" as const, error: accessError };
    }

    const transitionError = validateTechnicianStatusTransition(ticket.status, "QUALITY_INSPECTION");

    if (transitionError) {
      return { kind: "transition-error" as const, error: transitionError };
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        status: "QUALITY_INSPECTION",
        completedAt: new Date(),
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "STATUS_CHANGED",
        statusFrom: ticket.status,
        statusTo: "QUALITY_INSPECTION",
        note: "Technician submitted repair work for quality verification.",
        metadata: {
          source: "technician_workspace",
          submittedForQualityCheck: true,
        },
      },
    });

    return { kind: "updated" as const, ticket: await findTicketDetailInTransaction(tx, ticket.id) };
  });

  return toMutationResult(updatedTicket);
}

async function findTicketDetailInTransaction(tx: Prisma.TransactionClient, ticketId: string) {
  return tx.repairTicket.findUnique({
    where: { id: ticketId },
    select: technicianTicketDetailSelect,
  });
}

function toMutationResult(
  result:
    | { kind: "not-found" }
    | { kind: "forbidden"; error: TechnicianWorkspaceError }
    | { kind: "transition-error"; error: TechnicianWorkspaceError }
    | { kind: "updated"; ticket: TechnicianTicketDetailRecord | null },
): TechnicianWorkspaceResult<TechnicianTicketDetail> {
  if (result.kind === "not-found") {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (result.kind === "forbidden" || result.kind === "transition-error") {
    return result.error;
  }

  if (!result.ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    data: toTicketDetail(result.ticket),
  };
}
