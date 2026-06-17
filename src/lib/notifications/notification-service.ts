import type { NotificationChannel, NotificationStatus, PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import type { NotificationListQuery } from "@/lib/validations/notifications";

export type PublicNotification = {
  id: string;
  userId: string;
  ticketId: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationListResult = {
  notifications: PublicNotification[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  unreadCount: number;
};

const publicNotificationSelect = {
  id: true,
  userId: true,
  ticketId: true,
  channel: true,
  status: true,
  title: true,
  message: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toPublicNotification(notification: {
  id: string;
  userId: string;
  ticketId: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicNotification {
  return notification;
}

export async function listCurrentUserNotifications(
  prisma: PrismaClient,
  user: PublicUser,
  input: NotificationListQuery,
): Promise<NotificationListResult> {
  const where = {
    userId: user.id,
  };
  const skip = (input.page - 1) * input.pageSize;

  const [notifications, totalItems, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: publicNotificationSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: user.id,
        status: {
          not: "READ" as const,
        },
      },
    }),
  ]);

  return {
    notifications: notifications.map(toPublicNotification),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
    },
    unreadCount,
  };
}

export async function markNotificationAsRead(
  prisma: PrismaClient,
  user: PublicUser,
  notificationId: string,
): Promise<
  | {
      ok: true;
      notification: PublicNotification;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    }
> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: publicNotificationSelect,
  });

  if (!notification) {
    return {
      ok: false,
      status: 404,
      message: "Notification not found.",
    };
  }

  if (notification.userId !== user.id) {
    return {
      ok: false,
      status: 403,
      message: "You do not have permission to update this notification.",
    };
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: "READ",
      readAt: new Date(),
    },
    select: publicNotificationSelect,
  });

  return {
    ok: true,
    notification: toPublicNotification(updatedNotification),
  };
}
