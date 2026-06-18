import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublicTrackingInfo,
  isPublicRepairEvent,
  PublicTrackingValidationError,
} from "@/lib/service-desk/public-tracking";

const mockPrisma = vi.hoisted(() => ({
  repairTicket: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

const submittedAt = new Date("2026-06-18T08:00:00.000Z");
const assignedAt = new Date("2026-06-18T09:00:00.000Z");
const readyForPickupAt = new Date("2026-06-19T12:00:00.000Z");

function buildTicket() {
  return {
    trackingCode: "SIM-2026-000001",
    ticketId: "SIM-2026-000001",
    status: "READY_FOR_COLLECTION",
    severity: "HIGH",
    repairMethod: "HARDWARE_REPAIR",
    createdAt: submittedAt,
    assignedAt,
    readyForPickupAt,
    issueCategory: "HARDWARE_STORAGE",
    pickupCodeHash: "secret-hash",
    triageNotes: "Internal diagnosis details",
    requester: {
      fullName: "Asha Mohamed",
      phone: "+252610000111",
      email: "asha@example.invalid",
    },
    device: {
      deviceType: "Laptop",
      brand: "HP",
      serialNumber: "SN-SECRET",
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
        eventType: "REPAIR_NOTE_ADDED",
        createdAt: new Date("2026-06-18T10:00:00.000Z"),
        statusFrom: null,
        statusTo: null,
        custodyFrom: null,
        custodyTo: null,
        note: "Private repair note",
        metadata: { internal: true },
      },
      {
        eventType: "READY_FOR_PICKUP",
        createdAt: readyForPickupAt,
        statusFrom: "QUALITY_INSPECTION",
        statusTo: "READY_FOR_COLLECTION",
        custodyFrom: "IN_REPAIR_ROOM",
        custodyTo: "READY_FOR_COLLECTION",
        note: "Device can be collected",
        metadata: { checkInPhotoUrls: ["private-photo.jpg"] },
      },
    ],
  };
}

describe("public tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.repairTicket.findUnique.mockResolvedValue(buildTicket());
  });

  it("returns public-safe tracking information for a valid tracking code", async () => {
    const result = await getPublicTrackingInfo(" sim-2026-000001 ");

    expect(mockPrisma.repairTicket.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { trackingCode: "SIM-2026-000001" },
      }),
    );
    expect(result).toEqual({
      trackingCode: "SIM-2026-000001",
      status: "READY_FOR_COLLECTION",
      severity: "HIGH",
      repairMethod: "HARDWARE_REPAIR",
      submittedAt,
      assignedAt,
      readyForPickupAt,
      requesterName: "Asha",
      device: {
        deviceType: "Laptop",
        brand: "HP",
      },
      issueCategory: "HARDWARE_STORAGE",
      timeline: [
        {
          eventType: "TICKET_CREATED",
          occurredAt: submittedAt,
          statusFrom: null,
          statusTo: "REGISTRATION_COMPLETED",
          custodyFrom: null,
          custodyTo: null,
        },
        {
          eventType: "READY_FOR_PICKUP",
          occurredAt: readyForPickupAt,
          statusFrom: "QUALITY_INSPECTION",
          statusTo: "READY_FOR_COLLECTION",
          custodyFrom: "IN_REPAIR_ROOM",
          custodyTo: "READY_FOR_COLLECTION",
        },
      ],
    });
  });

  it("returns null when the ticket is not found", async () => {
    mockPrisma.repairTicket.findUnique.mockResolvedValueOnce(null);

    await expect(getPublicTrackingInfo("SIM-2026-999999")).resolves.toBeNull();
  });

  it("rejects invalid tracking code format before querying", async () => {
    await expect(getPublicTrackingInfo("bad-code")).rejects.toBeInstanceOf(PublicTrackingValidationError);
    expect(mockPrisma.repairTicket.findUnique).not.toHaveBeenCalled();
  });

  it("filters private repair events from the public timeline", () => {
    expect(isPublicRepairEvent({ eventType: "TICKET_CREATED" })).toBe(true);
    expect(isPublicRepairEvent({ eventType: "REPAIR_NOTE_ADDED" })).toBe(false);
  });

  it("does not leak contact data, pickup hashes, notes, metadata, or custody photos", async () => {
    const result = await getPublicTrackingInfo("SIM-2026-000001");
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("+252610000111");
    expect(serialized).not.toContain("asha@example.invalid");
    expect(serialized).not.toContain("secret-hash");
    expect(serialized).not.toContain("Internal diagnosis details");
    expect(serialized).not.toContain("Private repair note");
    expect(serialized).not.toContain("private-photo.jpg");
    expect(serialized).not.toContain("internal");
    expect(serialized).not.toContain("SN-SECRET");
  });
});
