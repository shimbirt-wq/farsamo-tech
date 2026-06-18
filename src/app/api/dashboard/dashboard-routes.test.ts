import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSessionToken } from "@/lib/auth/session";

const mockPrisma = vi.hoisted(() => ({
  notification: {
    count: vi.fn(),
  },
  repairTicket: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const now = new Date("2026-01-01T00:00:00.000Z");

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user_123",
    fullName: "Dashboard User",
    universityId: "SIMAD-DASH-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610001111",
    email: "dash@example.invalid",
    passwordHash: "$2a$12$hash",
    role: "STUDENT",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("dashboard route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns student dashboard data scoped to the current user's tickets", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "student_123", role: "STUDENT" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "student_123", role: "STUDENT" }));
    mockPrisma.notification.count.mockResolvedValue(2);
    mockPrisma.repairTicket.count.mockResolvedValue(3);
    mockPrisma.repairTicket.findMany.mockResolvedValue([
      {
        id: "ticket_1",
        ticketId: "TCK-STU-001",
        status: "DEVICE_RECEIVED",
        createdAt: now,
      },
    ]);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          device: {
            ownerId: "student_123",
          },
        }),
      }),
    );
    expect(body.dashboard.role).toBe("STUDENT");
    expect(body.dashboard.activeTickets).toBe(3);
    expect(body.dashboard.recentRepairHistory).toHaveLength(1);
    vi.unstubAllEnvs();
  });

  it("returns technician dashboard data scoped to assigned tickets", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "tech_123", role: "TECHNICIAN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "tech_123", role: "TECHNICIAN" }));
    mockPrisma.notification.count.mockResolvedValue(1);
    mockPrisma.repairTicket.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.repairTicket.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          technicianId: "tech_123",
        },
      }),
    );
    expect(body.dashboard.role).toBe("TECHNICIAN");
    expect(body.dashboard.assignedTickets).toBe(5);
    expect(body.dashboard.statusQueue).toHaveLength(6);
    vi.unstubAllEnvs();
  });

  it("returns admin dashboard data with global counts", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-value-that-is-long-enough");
    const token = await signSessionToken({ id: "admin_123", role: "ADMIN" });
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ id: "admin_123", role: "ADMIN" }));
    mockPrisma.notification.count.mockResolvedValue(4);
    mockPrisma.repairTicket.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2);
    const { GET } = await import("./route");

    const response = await GET(
      buildRequest("/api/dashboard", {
        headers: {
          cookie: `farsamotech_session=${token}`,
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashboard.role).toBe("ADMIN");
    expect(body.dashboard.totalTickets).toBe(12);
    expect(body.dashboard.pendingAssignments).toBe(3);
    expect(body.dashboard.activeRepairs).toBe(6);
    expect(body.dashboard.completedRepairs).toBe(2);
    vi.unstubAllEnvs();
  });

  it("rejects unauthenticated dashboard access", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("/api/dashboard"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
  });
});
