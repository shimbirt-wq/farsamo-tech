import type { RepairLog, RepairTicket, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  device: {
    findUnique: vi.fn(),
  },
  repairTicket: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  repairLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Ticket Owner",
    universityId: "SIMAD-TICKET-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "owner@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "STUDENT",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRepairTicket(overrides: Partial<RepairTicket> = {}) {
  return {
    id: "ticket_123",
    ticketId: "TCK-20260101-ABC123",
    deviceId: "device_123",
    technicianId: null,
    issueDescription: "Laptop battery drains too quickly during normal use.",
    photoUrl: null,
    status: "REGISTRATION_COMPLETED",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRepairTicketWithDevice(overrides: Partial<RepairTicket> = {}) {
  const ticket = buildRepairTicket(overrides);

  return {
    ...ticket,
    device: {
      id: ticket.deviceId,
      ownerId: "user_123",
      deviceType: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad T14",
      serialNumber: "SERIAL-123",
    },
  };
}

function buildRepairLog(overrides: Partial<RepairLog> = {}) {
  return {
    id: "log_123",
    ticketId: "ticket_123",
    technicianId: null,
    status: "REGISTRATION_COMPLETED",
    diagnosis: null,
    repairNotes: "Repair ticket registered.",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("repair ticket route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a valid ticket for an owned device", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.findUnique.mockResolvedValue({ id: "device_123", ownerId: "user_123" });
    mockPrisma.repairTicket.findUnique.mockResolvedValue(null);
    mockPrisma.repairTicket.create.mockResolvedValue(buildRepairTicketWithDevice());
    mockPrisma.repairLog.create.mockResolvedValue(buildRepairLog());
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
          technicianId: "should-be-ignored",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ticket.ticketId).toMatch(/^TCK-\d{8}-[A-Z0-9]{6}$/);
    expect(body.ticket.status).toBe("REGISTRATION_COMPLETED");
    expect(mockPrisma.repairTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
          status: "REGISTRATION_COMPLETED",
        }),
      }),
    );
    expect(mockPrisma.repairLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REGISTRATION_COMPLETED",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("rejects another user's device", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.device.findUnique.mockResolvedValue({ id: "device_123", ownerId: "other_user" });
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Laptop battery drains too quickly during normal use.",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You can only create tickets for your own devices.");
    vi.unstubAllEnvs();
  });

  it("rejects invalid ticket data", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "broken",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid repair ticket data.");
    vi.unstubAllEnvs();
  });

  it("creates the ticket and initial log in the same transaction", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "user_123", role: "LECTURER" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ role: "LECTURER" }));
    mockPrisma.device.findUnique.mockResolvedValue({ id: "device_123", ownerId: "user_123" });
    mockPrisma.repairTicket.findUnique.mockResolvedValue(null);
    mockPrisma.repairTicket.create.mockResolvedValue(buildRepairTicketWithDevice());
    mockPrisma.repairLog.create.mockResolvedValue(buildRepairLog());
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
    const { POST } = await import("./route");

    const response = await POST(
      buildRequest("/api/repair-tickets", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `farsamotech_session=${token}`,
        },
        body: JSON.stringify({
          deviceId: "device_123",
          issueDescription: "Screen flickers after startup and remains unstable.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.repairTicket.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.repairLog.create).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});
