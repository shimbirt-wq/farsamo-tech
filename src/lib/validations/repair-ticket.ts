import { RepairStatus } from "@prisma/client";
import { z } from "zod";

export const createRepairTicketSchema = z.object({
  deviceId: z.string().min(1, "Device is required"),
  issueDescription: z
    .string()
    .trim()
    .min(10, "Problem description must be at least 10 characters")
    .max(2000, "Problem description must be 2000 characters or less"),
  photoUrl: z
    .string()
    .trim()
    .url("Photo URL must be a valid URL")
    .optional()
    .transform((value) => value || undefined),
});

export const assignRepairTicketSchema = z.object({
  technicianId: z.string().min(1, "Technician is required"),
});

export const updateRepairTicketStatusSchema = z.object({
  status: z.nativeEnum(RepairStatus),
});

export const createRepairTicketLogSchema = z
  .object({
    diagnosis: z
      .string()
      .trim()
      .max(2000, "Diagnosis must be 2000 characters or less")
      .optional()
      .transform((value) => value || undefined),
    repairNotes: z
      .string()
      .trim()
      .max(2000, "Repair notes must be 2000 characters or less")
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((value, context) => {
    if (!value.diagnosis && !value.repairNotes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repairNotes"],
        message: "Provide a diagnosis or repair note.",
      });
    }
  });

export type CreateRepairTicketInput = z.infer<typeof createRepairTicketSchema>;
export type AssignRepairTicketInput = z.infer<typeof assignRepairTicketSchema>;
export type UpdateRepairTicketStatusInput = z.infer<typeof updateRepairTicketStatusSchema>;
export type CreateRepairTicketLogInput = z.infer<typeof createRepairTicketLogSchema>;
