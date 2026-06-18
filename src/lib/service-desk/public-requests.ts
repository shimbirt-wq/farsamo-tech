import type { Prisma, RepairStatus } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createNotificationForTicketEvent } from "@/lib/service-desk/notifications";
import { publicRepairRequestInputSchema, type PublicRepairRequestInput } from "@/lib/service-desk/validations";

export type PublicRepairRequestResponse = {
  trackingCode: string;
  requesterName: string;
  submittedAt: Date;
  status: RepairStatus;
  message: string;
};

type RequesterCandidate = {
  id: string;
};

export class PublicRepairRequestValidationError extends Error {
  constructor(readonly validationError: ZodError) {
    super("Invalid public repair request data.");
    this.name = "PublicRepairRequestValidationError";
  }
}

function getYearSegment(date = new Date()) {
  return date.getUTCFullYear().toString();
}

async function findReusableRequester(
  tx: Prisma.TransactionClient,
  requester: PublicRepairRequestInput["requester"],
): Promise<RequesterCandidate | null> {
  if (requester.universityId) {
    const matches = await tx.requester.findMany({
      where: { universityId: requester.universityId },
      select: { id: true },
      take: 2,
    });

    return matches.length === 1 ? matches[0] : null;
  }

  const matches = await tx.requester.findMany({
    where: { phone: requester.phone },
    select: { id: true },
    take: 2,
  });

  return matches.length === 1 ? matches[0] : null;
}

async function createOrReuseRequester(tx: Prisma.TransactionClient, requester: PublicRepairRequestInput["requester"]) {
  const reusableRequester = await findReusableRequester(tx, requester);

  if (reusableRequester) {
    return reusableRequester;
  }

  return tx.requester.create({
    data: {
      requesterType: requester.requesterType,
      fullName: requester.fullName,
      universityId: requester.universityId ?? null,
      faculty: requester.faculty ?? null,
      department: requester.department ?? null,
      phone: requester.phone,
      email: requester.email ?? null,
    },
    select: { id: true },
  });
}

async function createTrackingCode(tx: Prisma.TransactionClient) {
  const yearSegment = getYearSegment();
  const existingThisYear = await tx.repairTicket.count({
    where: {
      OR: [{ trackingCode: { startsWith: `SIM-${yearSegment}-` } }, { ticketId: { startsWith: `SIM-${yearSegment}-` } }],
    },
  });

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const sequence = existingThisYear + attempt;
    const trackingCode = `SIM-${yearSegment}-${sequence.toString().padStart(6, "0")}`;
    const existingTicket = await tx.repairTicket.findFirst({
      where: {
        OR: [{ trackingCode }, { ticketId: trackingCode }],
      },
      select: { id: true },
    });

    if (!existingTicket) {
      return trackingCode;
    }
  }

  throw new Error("Unable to generate a unique tracking code.");
}

export async function createPublicRepairRequest(input: unknown): Promise<PublicRepairRequestResponse> {
  const parsedInput = publicRepairRequestInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new PublicRepairRequestValidationError(parsedInput.error);
  }

  const data = parsedInput.data;

  const result = await prisma.$transaction(async (tx) => {
    const requester = await createOrReuseRequester(tx, data.requester);
    const device = await tx.device.create({
      data: {
        ownerId: null,
        requesterId: requester.id,
        deviceType: data.deviceType,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber ?? null,
        assetTag: data.assetTag ?? null,
      },
      select: { id: true },
    });
    const trackingCode = await createTrackingCode(tx);
    const ticket = await tx.repairTicket.create({
      data: {
        ticketId: trackingCode,
        trackingCode,
        requesterId: requester.id,
        deviceId: device.id,
        issueCategory: data.issueCategory,
        issueDescription: data.issueDescription,
        severity: null,
        repairMethod: null,
        triagedById: null,
        triagedAt: null,
        assignedAt: null,
        completedAt: null,
        readyForPickupAt: null,
        closedAt: null,
        cancelledAt: null,
        triageNotes: null,
        studentActionRequired: null,
        partRequirement: null,
        pickupCodeHash: null,
        status: "REGISTRATION_COMPLETED",
      },
      select: {
        id: true,
        trackingCode: true,
        ticketId: true,
        status: true,
        createdAt: true,
      },
    });

    await tx.repairEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: null,
        actorRole: null,
        eventType: "TICKET_CREATED",
        statusFrom: null,
        statusTo: "REGISTRATION_COMPLETED",
        custodyFrom: null,
        custodyTo: null,
        note: "Public repair request submitted",
        metadata: {
          issueCategory: data.issueCategory,
          source: "public_repair_request",
        },
      },
    });

    return {
      ticketId: ticket.id,
      trackingCode: ticket.trackingCode ?? ticket.ticketId,
      requesterName: data.requester.fullName,
      submittedAt: ticket.createdAt,
      status: ticket.status,
      message: "Repair request submitted.",
    };
  });

  await createNotificationForTicketEvent({
    ticketId: result.ticketId,
    eventType: "TICKET_RECEIVED",
  }).catch(() => null);

  return {
    trackingCode: result.trackingCode,
    requesterName: result.requesterName,
    submittedAt: result.submittedAt,
    status: result.status,
    message: result.message,
  };
}
