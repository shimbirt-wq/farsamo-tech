import type { NotificationProvider } from "@/lib/service-desk/notification-providers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNotificationEvent,
  createNotificationForTicketEvent,
  sendNotificationEvent,
  sendPendingNotificationEvents,
} from "@/lib/service-desk/notifications";
import { buildNotificationTemplate } from "@/lib/service-desk/notification-templates";
import { setNotificationProviderForTesting } from "@/lib/service-desk/notification-providers";

const mockPrisma = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  repairTicket: {
    findUnique: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-06-18T08:00:00.000Z");

function buildNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: "notification_123",
    userId: "user_123",
    ticketId: "ticket_123",
    channel: "DASHBOARD",
    status: "PENDING",
    title: "Repair request received",
    message: "We received ticket SIM-2026-000001.",
    readAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    issueCategory: "PERFORMANCE_SLOW",
    studentActionRequired: null,
    technicianId: "tech_123",
    requester: {
      fullName: "Asha Mohamed",
    },
    device: {
      ownerId: "student_123",
      deviceType: "Laptop",
      brand: "HP",
    },
    ...overrides,
  };
}

function buildRecipient(overrides: Record<string, unknown> = {}) {
  return {
    id: "student_123",
    fullName: "Asha Mohamed",
    email: "asha@example.invalid",
    phone: "+252610000111",
    ...overrides,
  };
}

describe("service desk notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNotificationProviderForTesting("DASHBOARD", null);
  });

  it("creates a notification event using a student-safe template", async () => {
    mockPrisma.notification.create.mockResolvedValue(buildNotification());

    const notification = await createNotificationEvent({
      userId: "student_123",
      ticketId: "ticket_123",
      eventType: "TICKET_RECEIVED",
      context: {
        trackingCode: "SIM-2026-000001",
        deviceBrand: "HP",
        deviceType: "Laptop",
      },
    });

    expect(notification.id).toBe("notification_123");
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "student_123",
          ticketId: "ticket_123",
          channel: "DASHBOARD",
          status: "PENDING",
          title: "Repair request received",
        }),
      }),
    );
  });

  it("creates notification events for ticket events", async () => {
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildTicket());
    mockPrisma.user.findUnique.mockResolvedValue(buildRecipient());
    mockPrisma.notification.create.mockResolvedValue(buildNotification());

    const notifications = await createNotificationForTicketEvent({
      ticketId: "ticket_123",
      eventType: "READY_FOR_PICKUP",
    });

    expect(notifications).toHaveLength(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "student_123",
          ticketId: "ticket_123",
          title: "Device ready for pickup",
        }),
      }),
    );
  });

  it("stub provider records a successful delivery attempt on the notification status", async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({
      ...buildNotification(),
      user: buildRecipient(),
    });
    mockPrisma.notification.update.mockResolvedValue(buildNotification({ status: "SENT" }));

    const result = await sendNotificationEvent("notification_123");

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        notificationId: "notification_123",
        provider: "local-stub",
      }),
    );
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notification_123" },
      data: { status: "SENT" },
    });
  });

  it("marks failed delivery without throwing", async () => {
    const failingProvider: NotificationProvider = {
      channel: "DASHBOARD",
      async send() {
        throw new Error("provider unavailable");
      },
    };
    setNotificationProviderForTesting("DASHBOARD", failingProvider);
    mockPrisma.notification.findUnique.mockResolvedValue({
      ...buildNotification(),
      user: buildRecipient(),
    });
    mockPrisma.notification.update.mockResolvedValue(buildNotification({ status: "FAILED" }));

    const result = await sendNotificationEvent("notification_123");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("provider unavailable");
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notification_123" },
      data: { status: "FAILED" },
    });
  });

  it("sends pending notification events in creation order", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([{ id: "notification_1" }, { id: "notification_2" }]);
    mockPrisma.notification.findUnique
      .mockResolvedValueOnce({ ...buildNotification({ id: "notification_1" }), user: buildRecipient() })
      .mockResolvedValueOnce({ ...buildNotification({ id: "notification_2" }), user: buildRecipient() });
    mockPrisma.notification.update.mockResolvedValue(buildNotification({ status: "SENT" }));

    const results = await sendPendingNotificationEvents(2);

    expect(results).toHaveLength(2);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
        take: 2,
      }),
    );
  });

  it("templates do not leak internal notes or custody-only data", () => {
    const template = buildNotificationTemplate("READY_FOR_PICKUP", {
      trackingCode: "SIM-2026-000001",
      deviceBrand: "HP",
      deviceType: "Laptop",
      studentActionRequired: "student-safe action",
      // These fields are intentionally not part of the template context contract.
      internalNotes: "replace motherboard quietly",
      storageLocation: "Shelf A3",
      pickupCodeHash: "hashed-secret",
    } as never);

    const serialized = `${template.title} ${template.message}`;

    expect(serialized).not.toContain("replace motherboard quietly");
    expect(serialized).not.toContain("Shelf A3");
    expect(serialized).not.toContain("hashed-secret");
  });
});
