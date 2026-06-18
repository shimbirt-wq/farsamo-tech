import { Prisma, type CustodyStatus, type RepairEventType, type RepairMethod, type RepairStatus, type Severity, type UserRole } from "@prisma/client";
import { ZodError } from "zod";
import type { PublicUser } from "@/lib/auth/public-user";
import { prisma } from "@/lib/db/prisma";
import { createNotificationForTicketEvent } from "@/lib/service-desk/notifications";
import {
  serviceDeskAssignmentInputSchema,
  triageUpdateInputSchema,
  type ServiceDeskAssignmentInput,
  type TriageUpdateInput,
} from "@/lib/service-desk/validations";

type LeadTriageErrorStatus = 404 | 409;

export type LeadTriageQueueTicket = {
  id: string;
  ticketId: string;
  trackingCode: string | null;
  status: RepairStatus;
  issueCategory: string | null;
  createdAt: Date;
  severity: Severity | null;
  repairMethod: RepairMethod | null;
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
  technician: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  } | null;
};

export type LeadTriageTicketDetail = LeadTriageQueueTicket & {
  requester: LeadTriageQueueTicket["requester"] & {
    phone: string | null;
    email: string | null;
  };
  device: LeadTriageQueueTicket["device"] & {
    id: string;
    serialNumber: string | null;
    assetTag: string | null;
    description: string | null;
  };
  issueDescription: string;
  photoUrl: string | null;
  triageNotes: string | null;
  studentActionRequired: string | null;
  partRequirement: string | null;
  triagedAt: Date | null;
  assignedAt: Date | null;
  readyForPickupAt: Date | null;
  triagedBy: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  } | null;
  custody: {
    id: string;
    status: CustodyStatus;
    receivedAt: Date | null;
    condition: string | null;
    screenCondition: string | null;
    keyboardCondition: string | null;
    batteryCondition: string | null;
    bodyCondition: string | null;
    accessories: Prisma.JsonValue;
    storageLocation: string | null;
    releasedById: string | null;
    readyForCollectionAt: Date | null;
    collectedByName: string | null;
    collectedByPhone: string | null;
    collectedAt: Date | null;
    pickupCodeVerifiedAt: Date | null;
    receivedBy: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null;
    releasedBy: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null;
  } | null;
  events: Array<{
    id: string;
    eventType: RepairEventType;
    actorRole: UserRole | null;
    statusFrom: string | null;
    statusTo: string | null;
    custodyFrom: CustodyStatus | null;
    custodyTo: CustodyStatus | null;
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

export type LeadTriageResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: LeadTriageErrorStatus;
      message: string;
    };

export class LeadTriageValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid lead triage data.");
    this.name = "LeadTriageValidationError";
  }
}

const staffUserSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  fullName: true,
  email: true,
  role: true,
});

const queueTicketSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  id: true,
  ticketId: true,
  trackingCode: true,
  status: true,
  issueCategory: true,
  createdAt: true,
  severity: true,
  repairMethod: true,
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
  technician: {
    select: staffUserSummarySelect,
  },
});

const leadTicketDetailSelect = Prisma.validator<Prisma.RepairTicketSelect>()({
  ...queueTicketSelect,
  issueDescription: true,
  photoUrl: true,
  triageNotes: true,
  studentActionRequired: true,
  partRequirement: true,
  triagedAt: true,
  assignedAt: true,
  readyForPickupAt: true,
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
  triagedBy: {
    select: staffUserSummarySelect,
  },
  custody: {
    select: {
      id: true,
      status: true,
      receivedAt: true,
      condition: true,
      screenCondition: true,
      keyboardCondition: true,
      batteryCondition: true,
      bodyCondition: true,
      accessories: true,
      storageLocation: true,
      releasedById: true,
      readyForCollectionAt: true,
      collectedByName: true,
      collectedByPhone: true,
      collectedAt: true,
      pickupCodeVerifiedAt: true,
      receivedBy: {
        select: staffUserSummarySelect,
      },
      releasedBy: {
        select: staffUserSummarySelect,
      },
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
      custodyFrom: true,
      custodyTo: true,
      note: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: staffUserSummarySelect,
      },
    },
  },
});

type QueueTicketRecord = Prisma.RepairTicketGetPayload<{ select: typeof queueTicketSelect }>;
type LeadTicketDetailRecord = Prisma.RepairTicketGetPayload<{ select: typeof leadTicketDetailSelect }>;

function toRequesterSummary(requester: QueueTicketRecord["requester"]): LeadTriageQueueTicket["requester"] {
  return {
    fullName: requester?.fullName ?? null,
    requesterType: requester?.requesterType ?? null,
    universityId: requester?.universityId ?? null,
    faculty: requester?.faculty ?? null,
    department: requester?.department ?? null,
  };
}

function toQueueTicket(ticket: QueueTicketRecord): LeadTriageQueueTicket {
  return {
    id: ticket.id,
    ticketId: ticket.ticketId,
    trackingCode: ticket.trackingCode,
    status: ticket.status,
    issueCategory: ticket.issueCategory,
    createdAt: ticket.createdAt,
    severity: ticket.severity,
    repairMethod: ticket.repairMethod,
    requester: toRequesterSummary(ticket.requester),
    device: ticket.device,
    technician: ticket.technician,
  };
}

function toTicketDetail(ticket: LeadTicketDetailRecord): LeadTriageTicketDetail {
  return {
    ...toQueueTicket(ticket),
    requester: {
      ...toRequesterSummary(ticket.requester),
      phone: ticket.requester?.phone ?? null,
      email: ticket.requester?.email ?? null,
    },
    device: ticket.device,
    issueDescription: ticket.issueDescription,
    photoUrl: ticket.photoUrl,
    triageNotes: ticket.triageNotes,
    studentActionRequired: ticket.studentActionRequired,
    partRequirement: ticket.partRequirement,
    triagedAt: ticket.triagedAt,
    assignedAt: ticket.assignedAt,
    readyForPickupAt: ticket.readyForPickupAt,
    triagedBy: ticket.triagedBy,
    custody: ticket.custody,
    events: ticket.events,
  };
}

function buildTicketLookupFilter(ticketIdOrTrackingCode: string) {
  return {
    OR: [
      { id: ticketIdOrTrackingCode },
      { ticketId: ticketIdOrTrackingCode },
      { trackingCode: ticketIdOrTrackingCode },
    ],
  };
}

async function findTicketForMutation(tx: Prisma.TransactionClient, ticketIdOrTrackingCode: string) {
  return tx.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: {
      id: true,
      ticketId: true,
      trackingCode: true,
      status: true,
      severity: true,
      repairMethod: true,
      technicianId: true,
    },
  });
}

async function findLeadTicketDetail(tx: Prisma.TransactionClient, ticketIdOrTrackingCode: string) {
  return tx.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: leadTicketDetailSelect,
  });
}

export async function listLeadTriageQueue(): Promise<LeadTriageQueueTicket[]> {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      status: { not: "DEVICE_COLLECTED" },
      OR: [{ triagedAt: null }, { severity: null }, { repairMethod: null }, { technicianId: null }],
    },
    select: queueTicketSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return tickets.map(toQueueTicket);
}

export async function getLeadTriageTicket(ticketIdOrTrackingCode: string): Promise<LeadTriageResult<LeadTriageTicketDetail>> {
  const ticket = await prisma.repairTicket.findFirst({
    where: buildTicketLookupFilter(ticketIdOrTrackingCode),
    select: leadTicketDetailSelect,
  });

  if (!ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  return {
    ok: true,
    data: toTicketDetail(ticket),
  };
}

export async function updateTicketTriage(input: {
  ticketIdOrTrackingCode: string;
  actor: PublicUser;
  data: unknown;
}): Promise<LeadTriageResult<LeadTriageTicketDetail>> {
  const parsedInput = triageUpdateInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new LeadTriageValidationError(parsedInput.error);
  }

  const triageData: TriageUpdateInput = parsedInput.data;

  const updatedTicket = await prisma.$transaction(async (tx) => {
    const ticket = await findTicketForMutation(tx, input.ticketIdOrTrackingCode);

    if (!ticket) {
      return null;
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        ...(triageData.issueCategory ? { issueCategory: triageData.issueCategory } : {}),
        severity: triageData.severity,
        repairMethod: triageData.repairMethod,
        triageNotes: triageData.triageNotes ?? null,
        studentActionRequired: triageData.studentActionRequired ?? null,
        partRequirement: triageData.partRequirement ?? null,
        triagedById: input.actor.id,
        triagedAt: new Date(),
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "TRIAGE_UPDATED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        custodyFrom: null,
        custodyTo: null,
        note: "Lead triage updated",
        metadata: {
          issueCategory: triageData.issueCategory ?? null,
          severity: triageData.severity,
          repairMethod: triageData.repairMethod,
        },
      },
    });

    return findLeadTicketDetail(tx, ticket.id);
  });

  if (!updatedTicket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  await createNotificationForTicketEvent({
    ticketId: updatedTicket.id,
    eventType: "TRIAGE_COMPLETED",
  }).catch(() => null);

  return {
    ok: true,
    data: toTicketDetail(updatedTicket),
  };
}

export async function assignTicketToTechnician(input: {
  ticketIdOrTrackingCode: string;
  actor: PublicUser;
  data: unknown;
}): Promise<LeadTriageResult<LeadTriageTicketDetail>> {
  const parsedInput = serviceDeskAssignmentInputSchema.safeParse(input.data);

  if (!parsedInput.success) {
    throw new LeadTriageValidationError(parsedInput.error);
  }

  const assignmentData: ServiceDeskAssignmentInput = parsedInput.data;

  const updatedTicket = await prisma.$transaction(async (tx) => {
    const [ticket, technician] = await Promise.all([
      findTicketForMutation(tx, input.ticketIdOrTrackingCode),
      tx.user.findUnique({
        where: { id: assignmentData.technicianId },
        select: {
          id: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      }),
    ]);

    if (!ticket) {
      return {
        kind: "not-found" as const,
      };
    }

    if (!technician) {
      return {
        kind: "missing-technician" as const,
      };
    }

    if (!technician.isActive || (technician.role !== "TECHNICIAN" && technician.role !== "LEAD_TECHNICIAN")) {
      return {
        kind: "invalid-technician" as const,
      };
    }

    await tx.repairTicket.update({
      where: { id: ticket.id },
      data: {
        technicianId: technician.id,
        assignedAt: new Date(),
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        eventType: "TECHNICIAN_ASSIGNED",
        statusFrom: ticket.status,
        statusTo: ticket.status,
        custodyFrom: null,
        custodyTo: null,
        note: "Ticket assigned to technician",
        metadata: {
          technicianId: technician.id,
          technicianRole: technician.role,
        },
      },
    });

    return {
      kind: "updated" as const,
      ticket: await findLeadTicketDetail(tx, ticket.id),
    };
  });

  if (updatedTicket?.kind === "not-found") {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  if (updatedTicket?.kind === "missing-technician") {
    return {
      ok: false,
      status: 404,
      message: "Technician not found.",
    };
  }

  if (updatedTicket?.kind === "invalid-technician") {
    return {
      ok: false,
      status: 409,
      message: "Only active technicians or lead technicians can be assigned repair tickets.",
    };
  }

  if (!updatedTicket?.ticket) {
    return {
      ok: false,
      status: 404,
      message: "Repair ticket not found.",
    };
  }

  await createNotificationForTicketEvent({
    ticketId: updatedTicket.ticket.id,
    eventType: "TECHNICIAN_ASSIGNED",
  }).catch(() => null);

  return {
    ok: true,
    data: toTicketDetail(updatedTicket.ticket),
  };
}
