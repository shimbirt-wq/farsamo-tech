import { describe, expect, it } from "vitest";
import {
  custodyCheckInInputSchema,
  custodyStatusTransitionInputSchema,
  pickupConfirmationInputSchema,
  publicRepairRequestInputSchema,
  studentActionRequestInputSchema,
  technicianRepairNoteInputSchema,
  technicianStatusUpdateInputSchema,
  triageUpdateInputSchema,
} from "@/lib/service-desk/validations";

const validPublicRepairRequest = {
  requester: {
    requesterType: "STUDENT",
    fullName: "Asha Mohamed",
    universityId: "SIMAD-2026-001",
    faculty: "Computing",
    department: "Computer Science",
    phone: "+252610000111",
    email: "asha@example.invalid",
  },
  deviceType: "Laptop",
  brand: "HP",
  model: "EliteBook",
  issueCategory: "PERFORMANCE_SLOW",
  issueDescription: "Laptop takes more than ten minutes to start and becomes slow during class work.",
};

describe("publicRepairRequestInputSchema", () => {
  it("accepts a valid public request payload", () => {
    const result = publicRepairRequestInputSchema.safeParse(validPublicRepairRequest);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requester.email).toBe("asha@example.invalid");
      expect(result.data.issueCategory).toBe("PERFORMANCE_SLOW");
    }
  });

  it("rejects missing phone, name, and issue description", () => {
    const result = publicRepairRequestInputSchema.safeParse({
      ...validPublicRepairRequest,
      requester: {
        ...validPublicRepairRequest.requester,
        fullName: "",
        phone: "",
      },
      issueDescription: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["requester.fullName", "requester.phone", "issueDescription"]));
    }
  });
});

describe("triageUpdateInputSchema", () => {
  it("requires severity and repair method", () => {
    const result = triageUpdateInputSchema.safeParse({
      triageNotes: "Likely SSD degradation. Needs physical diagnosis.",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["severity", "repairMethod"]));
    }
  });

  it("accepts a complete triage update", () => {
    const result = triageUpdateInputSchema.safeParse({
      issueCategory: "HARDWARE_STORAGE",
      severity: "HIGH",
      repairMethod: "HARDWARE_REPAIR",
      triageNotes: "Possible SSD failure.",
    });

    expect(result.success).toBe(true);
  });
});

describe("custodyCheckInInputSchema", () => {
  it("requires a storage location", () => {
    const result = custodyCheckInInputSchema.safeParse({
      condition: "Good",
      accessories: ["Charger"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain("storageLocation");
    }
  });

  it("accepts valid check-in details", () => {
    const result = custodyCheckInInputSchema.safeParse({
      condition: "Good",
      screenCondition: "No cracks",
      keyboardCondition: "Two worn keys",
      accessories: ["Charger"],
      storageLocation: "Shelf A3",
    });

    expect(result.success).toBe(true);
  });
});

describe("custodyStatusTransitionInputSchema", () => {
  it("accepts a valid custody transition target", () => {
    const result = custodyStatusTransitionInputSchema.safeParse({
      status: "IN_REPAIR_ROOM",
      note: "Moved to repair shelf.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid custody statuses", () => {
    const result = custodyStatusTransitionInputSchema.safeParse({
      status: "READY_FOR_PICKUP",
    });

    expect(result.success).toBe(false);
  });
});

describe("pickupConfirmationInputSchema", () => {
  it("requires collectedByName", () => {
    const result = pickupConfirmationInputSchema.safeParse({
      pickupCode: "123456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain("collectedByName");
    }
  });

  it("accepts a valid pickup confirmation", () => {
    const result = pickupConfirmationInputSchema.safeParse({
      collectedByName: "Asha Mohamed",
      collectedByPhone: "+252610000111",
      pickupCode: "123456",
    });

    expect(result.success).toBe(true);
  });
});

describe("technicianRepairNoteInputSchema", () => {
  it("requires diagnosis or repair notes", () => {
    const result = technicianRepairNoteInputSchema.safeParse({
      diagnosis: "",
      repairNotes: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts diagnosis and trims note text", () => {
    const result = technicianRepairNoteInputSchema.safeParse({
      diagnosis: "  SSD health check failed.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosis).toBe("SSD health check failed.");
    }
  });
});

describe("technicianStatusUpdateInputSchema", () => {
  it("accepts current compatible repair statuses", () => {
    const result = technicianStatusUpdateInputSchema.safeParse({
      status: "REPAIR_IN_PROGRESS",
      note: "Started OS repair.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid statuses", () => {
    const result = technicianStatusUpdateInputSchema.safeParse({
      status: "WAITING_FOR_STUDENT",
    });

    expect(result.success).toBe(false);
  });
});

describe("studentActionRequestInputSchema", () => {
  it("requires student action details", () => {
    const result = studentActionRequestInputSchema.safeParse({
      studentActionRequired: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts student action details", () => {
    const result = studentActionRequestInputSchema.safeParse({
      studentActionRequired: "Please provide your Windows account password at pickup desk.",
    });

    expect(result.success).toBe(true);
  });
});
