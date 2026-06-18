import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  repairTicket: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  repairEvent: {
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-06-18T08:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "tech_123",
    fullName: "Technician User",
    universityId: "SIMAD-TECH-001",
    faculty: "Computing",
    department: "Maintenance",
    phone: "+252610001111",
    email: "tech@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

async function authCookie(user: Pick<User, "id" | "role">) {
  vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
  const token = await signSessionToken({ id: user.id, role: user.role });

  return `farsamotech_session=${token}`;
}

function buildQueueTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "DIAGNOSIS_IN_PROGRESS",
    severity: "HIGH",
    repairMethod: "HARDWARE_REPAIR",
    issueCategory: "HARDWARE_STORAGE",
    createdAt: now,
    assignedAt: now,
    requester: {
      fullName: "Asha Mohamed",
      requesterType: "STUDENT",
      universityId: "SIMAD-2026-001",
      faculty: "Computing",
      department: "Computer Science",
    },
    device: {
      deviceType: "Laptop",
      brand: "HP",
      model: "EliteBook",
    },
    ...overrides,
  };
}

function buildMutationTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket_123",
    ticketId: "SIM-2026-000001",
    trackingCode: "SIM-2026-000001",
    status: "DIAGNOSIS_IN_PROGRESS",
    technicianId: "tech_123",
    ...overrides,
  };
}

function buildTicketDetail(overrides: Record<string, unknown> = {}) {
  return {
    ...buildQueueTicket(),
    technicianId: "tech_123",
    issueDescription: "Laptop is very slow and sometimes fails to boot.",
    studentActionRequired: null,
    partRequirement: null,
    requester: {
      fullName: "Asha Mohamed",
      requesterType: "STUDENT",
      universityId: "SIMAD-2026-001",
      faculty: "Computing",
      department: "Computer Science",
      phone: "+252610000111",
      email: "asha@example.invalid",
    },
    device: {
      id: "device_123",
      deviceType: "Laptop",
      brand: "HP",
      model: "EliteBook",
      serialNumber: "SN-123",
      assetTag: null,
      description: null,
    },
    custody: {
      id: "custody_123",
      status: "IN_REPAIR_ROOM",
      receivedAt: now,
      condition: "Good",
      accessories: ["Charger"],
      storageLocation: "Shelf A3",
      readyForCollectionAt: null,
      collectedAt: null,
    },
    events: [
      {
        id: "event_123",
        eventType: "TECHNICIAN_ASSIGNED",
        actorRole: "LEAD_TECHNICIAN",
        statusFrom: "DIAGNOSIS_IN_PROGRESS",
        statusTo: "DIAGNOSIS_IN_PROGRESS",
        note: "Assigned",
        metadata: {},
        createdAt: now,
        actor: {
          id: "lead_123",
          fullName: "Lead User",
          email: "lead@example.invalid",
          role: "LEAD_TECHNICIAN",
        },
      },
    ],
    ...overrides,
  };
}

describe("technician workspace route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
  });

  it("lists only tickets assigned to the authenticated technician", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findMany.mockResolvedValue([buildQueueTicket()]);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/technician/workspace/tickets", {
        headers: { cookie },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          technicianId: "tech_123",
          status: { not: "DEVICE_COLLECTED" },
        }),
      }),
    );
    expect(body.tickets).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("phone");
    vi.unstubAllEnvs();
  });

  it("blocks unauthenticated users from the technician queue", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/technician/workspace/tickets"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
    expect(mockPrisma.repairTicket.findMany).not.toHaveBeenCalled();
  });

  it("blocks technicians from viewing unassigned ticket detail", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildTicketDetail({ technicianId: "other_tech" }));
    const { GET } = await import("./[ticketId]/route");

    const response = await GET(
      buildRequest("/api/technician/workspace/tickets/ticket_123", {
        headers: { cookie },
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("You can only access tickets assigned to you.");
    vi.unstubAllEnvs();
  });

  it("allows technicians to add internal notes to assigned tickets and creates a repair event", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket());
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildTicketDetail());
    mockPrisma.repairEvent.create.mockResolvedValue({ id: "event_note" });
    const { POST } = await import("./[ticketId]/notes/route");

    const response = await POST(
      buildRequest("/api/technician/workspace/tickets/ticket_123/notes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          diagnosis: "SSD health check failed.",
          repairNotes: "Prepared replacement recommendation.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "REPAIR_NOTE_ADDED",
          actorId: "tech_123",
          note: expect.stringContaining("SSD health check failed."),
          metadata: expect.objectContaining({
            visibility: "internal",
          }),
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("blocks technicians from adding notes to unassigned tickets", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ technicianId: "other_tech" }));
    const { POST } = await import("./[ticketId]/notes/route");

    const response = await POST(
      buildRequest("/api/technician/workspace/tickets/ticket_123/notes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          repairNotes: "This should not be accepted.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(403);
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("allows technicians to request student action and creates a repair event", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "lead_123",
      fullName: "Lead Technician",
      email: "lead@example.invalid",
      phone: "+252610001111",
    });
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket());
    mockPrisma.repairTicket.findUnique.mockResolvedValue(
      buildTicketDetail({ studentActionRequired: "Bring charger for testing." }),
    );
    mockPrisma.notification.create.mockResolvedValue({
      id: "notification_123",
      userId: "lead_123",
      ticketId: "ticket_123",
      channel: "DASHBOARD",
      status: "PENDING",
      title: "Student action needed",
      message: "Action is needed for ticket SIM-2026-000001: Bring charger for testing.",
      readAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const { PATCH } = await import("./[ticketId]/request-student-action/route");

    const response = await PATCH(
      buildRequest("/api/technician/workspace/tickets/ticket_123/request-student-action", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          studentActionRequired: "Bring charger for testing.",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: { studentActionRequired: "Bring charger for testing." },
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "STUDENT_ACTION_REQUESTED",
          metadata: expect.objectContaining({
            notificationTodo: expect.any(String),
          }),
        }),
      }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "lead_123",
          ticketId: "ticket_123",
          title: "Student action needed",
          message: expect.stringContaining("Bring charger for testing."),
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("allows technicians to submit assigned repair work for quality check", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ status: "REPAIR_IN_PROGRESS" }));
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildTicketDetail({ status: "QUALITY_INSPECTION" }));
    const { PATCH } = await import("./[ticketId]/submit-quality-check/route");

    const response = await PATCH(
      buildRequest("/api/technician/workspace/tickets/ticket_123/submit-quality-check", {
        method: "PATCH",
        headers: { cookie },
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket_123" },
        data: expect.objectContaining({
          status: "QUALITY_INSPECTION",
          completedAt: expect.any(Date),
        }),
      }),
    );
    expect(mockPrisma.repairEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "STATUS_CHANGED",
          statusFrom: "REPAIR_IN_PROGRESS",
          statusTo: "QUALITY_INSPECTION",
        }),
      }),
    );
    vi.unstubAllEnvs();
  });

  it("rejects invalid technician status transitions", async () => {
    const cookie = await authCookie({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser());
    mockPrisma.repairTicket.findFirst.mockResolvedValue(buildMutationTicket({ status: "DIAGNOSIS_IN_PROGRESS" }));
    const { PATCH } = await import("./[ticketId]/status/route");

    const response = await PATCH(
      buildRequest("/api/technician/workspace/tickets/ticket_123/status", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          status: "QUALITY_INSPECTION",
        }),
      }),
      { params: Promise.resolve({ ticketId: "ticket_123" }) },
    );

    expect(response.status).toBe(409);
    expect(mockPrisma.repairTicket.update).not.toHaveBeenCalled();
    expect(mockPrisma.repairEvent.create).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
