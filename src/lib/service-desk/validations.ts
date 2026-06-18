import { CustodyStatus, RepairMethod, RepairStatus, RequesterType, Severity } from "@prisma/client";
import { z } from "zod";
import { ISSUE_CATEGORY_OPTIONS } from "@/lib/service-desk/constants";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const requiredTrimmedString = (fieldName: string, max: number, min = 1) =>
  z.string().trim().min(min, `${fieldName} is required`).max(max, `${fieldName} must be ${max} characters or less`);

export const publicRequesterInputSchema = z.object({
  requesterType: z.nativeEnum(RequesterType),
  fullName: requiredTrimmedString("Full name", 120, 2),
  universityId: optionalTrimmedString(60),
  faculty: optionalTrimmedString(120),
  department: optionalTrimmedString(120),
  phone: requiredTrimmedString("Phone number", 30, 7),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required")
    .max(160)
    .optional()
    .transform((value) => value || undefined),
});

export const publicRepairRequestInputSchema = z.object({
  requester: publicRequesterInputSchema,
  deviceType: requiredTrimmedString("Device type", 80, 2),
  brand: requiredTrimmedString("Brand", 80, 2),
  model: requiredTrimmedString("Model", 120, 2),
  serialNumber: optionalTrimmedString(120),
  assetTag: optionalTrimmedString(120),
  issueCategory: z.enum(ISSUE_CATEGORY_OPTIONS),
  issueDescription: requiredTrimmedString("Issue description", 2000, 10),
  severity: z.nativeEnum(Severity).optional(),
});

export const triageUpdateInputSchema = z.object({
  issueCategory: z.enum(ISSUE_CATEGORY_OPTIONS).optional(),
  severity: z.nativeEnum(Severity),
  repairMethod: z.nativeEnum(RepairMethod),
  triageNotes: optionalTrimmedString(2000),
  studentActionRequired: optionalTrimmedString(2000),
  partRequirement: optionalTrimmedString(1000),
});

export const serviceDeskAssignmentInputSchema = z.object({
  technicianId: requiredTrimmedString("Technician", 100),
});

export const custodyCheckInInputSchema = z.object({
  condition: optionalTrimmedString(500),
  screenCondition: optionalTrimmedString(500),
  keyboardCondition: optionalTrimmedString(500),
  batteryCondition: optionalTrimmedString(500),
  bodyCondition: optionalTrimmedString(500),
  accessories: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  storageLocation: requiredTrimmedString("Storage location", 120),
  checkInPhotoUrls: z.array(z.string().trim().min(1).max(500)).max(12).optional(),
});

export const pickupConfirmationInputSchema = z.object({
  collectedByName: requiredTrimmedString("Collector name", 120, 2),
  collectedByPhone: optionalTrimmedString(30),
  pickupCode: optionalTrimmedString(120),
});

export const custodyStatusTransitionInputSchema = z.object({
  status: z.nativeEnum(CustodyStatus),
  note: optionalTrimmedString(1000),
});

export const technicianRepairNoteInputSchema = z
  .object({
    diagnosis: optionalTrimmedString(2000),
    repairNotes: optionalTrimmedString(4000),
  })
  .refine((value) => Boolean(value.diagnosis || value.repairNotes), {
    message: "Diagnosis or repair notes are required",
    path: ["repairNotes"],
  });

export const technicianStatusUpdateInputSchema = z.object({
  status: z.nativeEnum(RepairStatus),
  note: optionalTrimmedString(1000),
});

export const studentActionRequestInputSchema = z.object({
  studentActionRequired: requiredTrimmedString("Student action request", 2000, 3),
});

export type PublicRequesterInput = z.infer<typeof publicRequesterInputSchema>;
export type PublicRepairRequestInput = z.infer<typeof publicRepairRequestInputSchema>;
export type TriageUpdateInput = z.infer<typeof triageUpdateInputSchema>;
export type ServiceDeskAssignmentInput = z.infer<typeof serviceDeskAssignmentInputSchema>;
export type CustodyCheckInInput = z.infer<typeof custodyCheckInInputSchema>;
export type PickupConfirmationInput = z.infer<typeof pickupConfirmationInputSchema>;
export type CustodyStatusTransitionInput = z.infer<typeof custodyStatusTransitionInputSchema>;
export type TechnicianRepairNoteInput = z.infer<typeof technicianRepairNoteInputSchema>;
export type TechnicianStatusUpdateInput = z.infer<typeof technicianStatusUpdateInputSchema>;
export type StudentActionRequestInput = z.infer<typeof studentActionRequestInputSchema>;
