import type { Notification, NotificationChannel, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getNotificationProvider } from "@/lib/service-desk/notification-providers";
import {
  buildNotificationTemplate,
  type NotificationTemplateContext,
  type ServiceDeskNotificationEventType,
} from "@/lib/service-desk/notification-templates";

type NotificationRecipient = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type TicketNotificationContext = NotificationTemplateContext & {
  ticketId: string;
  technicianId?: string | null;
  ownerId?: string | null;
};

export type CreateNotificationEventInput = {
  userId: string;
  ticketId?: string | null;
  channel?: NotificationChannel;
  eventType: ServiceDeskNotificationEventType;
  title?: string;
  message?: string;
  context?: NotificationTemplateContext;
};

export type CreateNotificationForTicketEventInput = {
  ticketId: string;
  eventType: ServiceDeskNotificationEventType;
  channels?: NotificationChannel[];
  context?: NotificationTemplateContext;
};

export type SendNotificationEventResult = {
  ok: boolean;
  notificationId: string;
  provider?: string;
  error?: string;
};

const DEFAULT_CHANNELS: NotificationChannel[] = ["DASHBOARD"];
const STAFF_FALLBACK_ROLES: UserRole[] = ["LEAD_TECHNICIAN", "ADMIN"];

const notificationTicketSelect = {
  id: true,
  ticketId: true,
  trackingCode: true,
  issueCategory: true,
  studentActionRequired: true,
  technicianId: true,
  requester: {
    select: {
      fullName: true,
    },
  },
  device: {
    select: {
      ownerId: true,
      deviceType: true,
      brand: true,
    },
  },
} satisfies Prisma.RepairTicketSelect;

function toTicketNotificationContext(
  ticket: Prisma.RepairTicketGetPayload<{ select: typeof notificationTicketSelect }>,
  inputContext: NotificationTemplateContext | undefined,
): TicketNotificationContext {
  return {
    ticketId: ticket.id,
    trackingCode: ticket.trackingCode ?? ticket.ticketId,
    requesterName: ticket.requester?.fullName ?? null,
    deviceType: ticket.device.deviceType,
    deviceBrand: ticket.device.brand,
    issueCategory: ticket.issueCategory,
    studentActionRequired: inputContext?.studentActionRequired ?? ticket.studentActionRequired,
    technicianId: ticket.technicianId,
    ownerId: ticket.device.ownerId,
    ...inputContext,
  };
}

async function findFallbackStaffRecipient(): Promise<NotificationRecipient | null> {
  return prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        in: STAFF_FALLBACK_ROLES,
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}

async function findRecipientForTicketEvent(
  eventType: ServiceDeskNotificationEventType,
  context: TicketNotificationContext,
): Promise<NotificationRecipient | null> {
  if (eventType === "TECHNICIAN_ASSIGNED" && context.technicianId) {
    return prisma.user.findUnique({
      where: { id: context.technicianId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });
  }

  if (context.ownerId) {
    return prisma.user.findUnique({
      where: { id: context.ownerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });
  }

  return findFallbackStaffRecipient();
}

export async function createNotificationEvent(input: CreateNotificationEventInput): Promise<Notification> {
  const template = buildNotificationTemplate(input.eventType, input.context);

  return prisma.notification.create({
    data: {
      userId: input.userId,
      ticketId: input.ticketId ?? null,
      channel: input.channel ?? "DASHBOARD",
      status: "PENDING",
      title: input.title ?? template.title,
      message: input.message ?? template.message,
    },
  });
}

export async function createNotificationForTicketEvent(
  input: CreateNotificationForTicketEventInput,
): Promise<Notification[]> {
  const ticket = await prisma.repairTicket.findUnique({
    where: { id: input.ticketId },
    select: notificationTicketSelect,
  });

  if (!ticket) {
    return [];
  }

  const context = toTicketNotificationContext(ticket, input.context);
  const recipient = await findRecipientForTicketEvent(input.eventType, context);

  if (!recipient) {
    return [];
  }

  const channels = input.channels?.length ? input.channels : DEFAULT_CHANNELS;
  const notifications: Notification[] = [];

  for (const channel of channels) {
    notifications.push(
      await createNotificationEvent({
        userId: recipient.id,
        ticketId: ticket.id,
        channel,
        eventType: input.eventType,
        context,
      }),
    );
  }

  return notifications;
}

export async function sendNotificationEvent(notificationEventId: string): Promise<SendNotificationEventResult> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationEventId },
    select: {
      id: true,
      channel: true,
      title: true,
      message: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!notification) {
    return {
      ok: false,
      notificationId: notificationEventId,
      error: "Notification event not found.",
    };
  }

  const provider = getNotificationProvider(notification.channel);

  try {
    const attempt = await provider.send({
      notificationId: notification.id,
      channel: notification.channel,
      title: notification.title,
      message: notification.message,
      recipient: notification.user,
    });

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: attempt.ok ? "SENT" : "FAILED",
      },
    });

    return {
      ok: attempt.ok,
      notificationId: notification.id,
      provider: attempt.provider,
      error: attempt.error,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification provider failed.";

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "FAILED",
      },
    });

    return {
      ok: false,
      notificationId: notification.id,
      provider: provider.constructor.name,
      error: message,
    };
  }
}

export async function sendPendingNotificationEvents(limit = 25): Promise<SendNotificationEventResult[]> {
  const notifications = await prisma.notification.findMany({
    where: { status: "PENDING" },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });

  const results: SendNotificationEventResult[] = [];

  for (const notification of notifications) {
    results.push(await sendNotificationEvent(notification.id));
  }

  return results;
}
