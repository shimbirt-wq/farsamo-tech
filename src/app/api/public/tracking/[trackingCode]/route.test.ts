import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  repairTicket: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const submittedAt = new Date("2026-06-18T08:00:00.000Z");

function buildContext(trackingCode?: string) {
  return {
    params: Promise.resolve({ trackingCode }),
  };
}

function buildRequest(trackingCode = "SIM-2026-000001") {
  return new Request(`http://localhost/api/public/tracking/${trackingCode}`, {
    method: "GET",
  });
}

describe("public tracking route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.repairTicket.findUnique.mockResolvedValue({
      trackingCode: "SIM-2026-000001",
      ticketId: "SIM-2026-000001",
      status: "REGISTRATION_COMPLETED",
      severity: null,
      repairMethod: null,
      createdAt: submittedAt,
      assignedAt: null,
      readyForPickupAt: null,
      issueCategory: "PERFORMANCE_SLOW",
      requester: {
        fullName: "Asha Mohamed",
        phone: "+252610000111",
        email: "asha@example.invalid",
      },
      device: {
        deviceType: "Laptop",
        brand: "HP",
      },
      events: [
        {
          eventType: "TICKET_CREATED",
          createdAt: submittedAt,
          statusFrom: null,
          statusTo: "REGISTRATION_COMPLETED",
          custodyFrom: null,
          custodyTo: null,
          note: "Public repair request submitted",
          metadata: { source: "public_repair_request" },
        },
        {
          eventType: "CUSTODY_CHANGED",
          createdAt: submittedAt,
          statusFrom: "REGISTRATION_COMPLETED",
          statusTo: "REGISTRATION_COMPLETED",
          custodyFrom: "NOT_RECEIVED",
          custodyTo: "RECEIVED",
          note: "Device checked in at Shelf A3",
          metadata: { storageLocation: "Shelf A3", checkInPhotoUrls: ["private/photo.jpg"] },
        },
      ],
      pickupCodeHash: "secret-hash",
      triageNotes: "Internal only",
      custody: {
        storageLocation: "Shelf A3",
        checkInPhotoUrls: ["private/photo.jpg"],
      },
    });
  });

  it("returns public tracking information without requiring login", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest(), buildContext("SIM-2026-000001"));
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      trackingCode: "SIM-2026-000001",
      status: "REGISTRATION_COMPLETED",
      severity: null,
      repairMethod: null,
      submittedAt: submittedAt.toISOString(),
      assignedAt: null,
      readyForPickupAt: null,
      requesterName: "Asha",
      device: {
        deviceType: "Laptop",
        brand: "HP",
      },
      issueCategory: "PERFORMANCE_SLOW",
      timeline: [
        {
          eventType: "TICKET_CREATED",
          occurredAt: submittedAt.toISOString(),
          statusFrom: null,
          statusTo: "REGISTRATION_COMPLETED",
          custodyFrom: null,
          custodyTo: null,
        },
      ],
    });
    expect(serialized).not.toContain("+252610000111");
    expect(serialized).not.toContain("asha@example.invalid");
    expect(serialized).not.toContain("secret-hash");
    expect(serialized).not.toContain("Internal only");
    expect(serialized).not.toContain("Public repair request submitted");
    expect(serialized).not.toContain("CUSTODY_CHANGED");
    expect(serialized).not.toContain("Shelf A3");
    expect(serialized).not.toContain("private/photo.jpg");
  });

  it("returns 400 when the route param is missing", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest(""), buildContext());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid tracking code format.");
    expect(mockPrisma.repairTicket.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid tracking code format", async () => {
    const { GET } = await import("./route");

    const response = await GET(buildRequest("bad-code"), buildContext("bad-code"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid tracking code format.");
    expect(mockPrisma.repairTicket.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the tracking code is not found", async () => {
    mockPrisma.repairTicket.findUnique.mockResolvedValueOnce(null);
    const { GET } = await import("./route");

    const response = await GET(buildRequest("SIM-2026-999999"), buildContext("SIM-2026-999999"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Tracking code not found.");
  });
});
