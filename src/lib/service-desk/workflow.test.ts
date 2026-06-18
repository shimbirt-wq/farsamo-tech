import { describe, expect, it } from "vitest";
import {
  canTechnicianWorkOnTicket,
  canTransitionCustody,
  isFinalCustodyStatus,
  requiresPhysicalCustody,
} from "@/lib/service-desk/workflow";

describe("canTransitionCustody", () => {
  it("accepts each next-step custody transition", () => {
    expect(canTransitionCustody("NOT_RECEIVED", "RECEIVED")).toBe(true);
    expect(canTransitionCustody("RECEIVED", "IN_REPAIR_ROOM")).toBe(true);
    expect(canTransitionCustody("IN_REPAIR_ROOM", "READY_FOR_COLLECTION")).toBe(true);
    expect(canTransitionCustody("READY_FOR_COLLECTION", "COLLECTED")).toBe(true);
  });

  it("rejects skipped, backward, and same-status custody transitions", () => {
    expect(canTransitionCustody("NOT_RECEIVED", "IN_REPAIR_ROOM")).toBe(false);
    expect(canTransitionCustody("READY_FOR_COLLECTION", "RECEIVED")).toBe(false);
    expect(canTransitionCustody("RECEIVED", "RECEIVED")).toBe(false);
    expect(canTransitionCustody("COLLECTED", "READY_FOR_COLLECTION")).toBe(false);
  });
});

describe("isFinalCustodyStatus", () => {
  it("treats collected as the final custody status", () => {
    expect(isFinalCustodyStatus("COLLECTED")).toBe(true);
    expect(isFinalCustodyStatus("READY_FOR_COLLECTION")).toBe(false);
  });
});

describe("requiresPhysicalCustody", () => {
  it("requires custody for walk-in, hardware, and software repair methods", () => {
    expect(requiresPhysicalCustody("WALK_IN_SERVICE")).toBe(true);
    expect(requiresPhysicalCustody("HARDWARE_REPAIR")).toBe(true);
    expect(requiresPhysicalCustody("SOFTWARE_REPAIR")).toBe(true);
  });

  it("does not require custody for remote support", () => {
    expect(requiresPhysicalCustody("REMOTE_SUPPORT")).toBe(false);
  });
});

describe("canTechnicianWorkOnTicket", () => {
  it("allows assigned technicians to work on their ticket", () => {
    expect(canTechnicianWorkOnTicket({ id: "tech_1", role: "TECHNICIAN" }, { technicianId: "tech_1" })).toBe(true);
  });

  it("blocks unassigned technicians", () => {
    expect(canTechnicianWorkOnTicket({ id: "tech_2", role: "TECHNICIAN" }, { technicianId: "tech_1" })).toBe(false);
  });

  it("allows lead technicians and admins broader access", () => {
    expect(canTechnicianWorkOnTicket({ id: "lead_1", role: "LEAD_TECHNICIAN" }, { technicianId: null })).toBe(true);
    expect(canTechnicianWorkOnTicket({ id: "admin_1", role: "ADMIN" }, { technicianId: null })).toBe(true);
  });
});
