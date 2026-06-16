import { RepairStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import type { CreateRepairTicketInput } from "@/lib/validations/repair-ticket";

export type PublicRepairTicket = {
  id: string;
  ticketId: string;
  deviceId: string;
  technicianId: string | null;
  issueDescription: string;
  photoUrl: string | null;
  status: RepairStatus;
  createdAt: Date;
  updatedAt: Date;
  device: {
    id: string;
    ownerId: string;
    deviceType: string;
    brand: string;
    model: string;
    serialNumber: string | null;
  };
};

const publicRepairTicketSelect = {
  id: true,
  ticketId: true,
  deviceId: true,
  technicianId: true,
  issueDescription: true,
  photoUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  device: {
    select: {
      id: true,
      ownerId: true,
      deviceType: true,
      brand: true,
      model: true,
      serialNumber: true,
    },
  },
} as const;

function toPublicRepairTicket(
  ticket: {
    id: string;
    ticketId: string;
    deviceId: string;
    technicianId: string | null;
    issueDescription: string;
    photoUrl: string | null;
    status: RepairStatus;
    createdAt: Date;
    updatedAt: Date;
    device: {
      id: string;
      ownerId: string;
      deviceType: string;
      brand: string;
      model: string;
      serialNumber: string | null;
    };
  },
): PublicRepairTicket {
  return ticket;
}

function generateTicketId() {
  const dateSegment = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `TCK-${dateSegment}-${randomSegment}`;
}

async function createTicketId(tx: PrismaClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketId = generateTicketId();
    const existingTicket = await tx.repairTicket.findUnique({
      where: { ticketId },
      select: { id: true },
    });

    if (!existingTicket) {
      return ticketId;
    }
  }

  throw new Error("Unable to generate a unique ticket ID.");
}

export async function createRepairTicket(
  prisma: PrismaClient,
  user: PublicUser,
  input: CreateRepairTicketInput,
): Promise<
  | {
      ok: true;
      ticket: PublicRepairTicket;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    }
> {
  if (user.role !== "STUDENT" && user.role !== "LECTURER") {
    return {
      ok: false,
      status: 403,
      message: "Only students and lecturers can create repair tickets.",
    };
  }

  const device = await prisma.device.findUnique({
    where: { id: input.deviceId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!device) {
    return {
      ok: false,
      status: 404,
      message: "Device not found.",
    };
  }

  if (device.ownerId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: "You can only create tickets for your own devices.",
    };
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketId = await createTicketId(tx as unknown as PrismaClient);

    const createdTicket = await tx.repairTicket.create({
      data: {
        ticketId,
        deviceId: input.deviceId,
        issueDescription: input.issueDescription,
        photoUrl: input.photoUrl ?? null,
        status: "REGISTRATION_COMPLETED",
      },
      select: publicRepairTicketSelect,
    });

    await tx.repairLog.create({
      data: {
        ticketId: createdTicket.id,
        technicianId: null,
        status: "REGISTRATION_COMPLETED",
        diagnosis: null,
        repairNotes: "Repair ticket registered.",
      },
    });

    return createdTicket;
  });

  return {
    ok: true,
    ticket: toPublicRepairTicket(ticket),
  };
}

export async function listOwnedRepairTickets(prisma: PrismaClient, user: PublicUser) {
  const tickets = await prisma.repairTicket.findMany({
    where: {
      device: {
        ownerId: user.id,
      },
    },
    select: publicRepairTicketSelect,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 10,
  });

  return tickets.map(toPublicRepairTicket);
}
