import type { RepairStatus } from "@prisma/client";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

const statusClassName: Record<RepairStatus, string> = {
  REGISTRATION_COMPLETED: "status-registration",
  DEVICE_RECEIVED: "status-received",
  DIAGNOSIS_IN_PROGRESS: "status-diagnosis",
  REPAIR_IN_PROGRESS: "status-repair",
  QUALITY_INSPECTION: "status-quality",
  READY_FOR_COLLECTION: "status-ready",
  DEVICE_COLLECTED: "status-collected",
};

export function StatusBadge({ status }: { status: RepairStatus }) {
  return <span className={`status-badge ${statusClassName[status]}`}>{REPAIR_STATUS_LABELS[status]}</span>;
}
