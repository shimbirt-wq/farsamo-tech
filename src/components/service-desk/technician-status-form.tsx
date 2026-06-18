"use client";

import { useState, useTransition } from "react";
import { REPAIR_STATUS_LABELS, REPAIR_STATUS_FLOW } from "@/lib/constants/repair-status";
import type { TechnicianTicketDetailData } from "@/components/service-desk/technician-ticket-detail";

type StatusResponse = {
  error?: string;
  ticket?: TechnicianTicketDetailData;
};

const technicianSafeStatuses = ["DIAGNOSIS_IN_PROGRESS", "REPAIR_IN_PROGRESS", "QUALITY_INSPECTION"] as const;
type TechnicianSafeStatus = (typeof technicianSafeStatuses)[number];

function isTechnicianSafeStatus(status: string): status is TechnicianSafeStatus {
  return technicianSafeStatuses.includes(status as TechnicianSafeStatus);
}

function getNextSafeStatus(currentStatus: string) {
  const currentIndex = REPAIR_STATUS_FLOW.indexOf(currentStatus as (typeof REPAIR_STATUS_FLOW)[number]);

  if (currentIndex < 0) {
    return "";
  }

  const nextStatus = REPAIR_STATUS_FLOW[currentIndex + 1];

  return nextStatus && isTechnicianSafeStatus(nextStatus) ? nextStatus : "";
}

export function TechnicianStatusForm({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: TechnicianTicketDetailData) => void;
  ticket: TechnicianTicketDetailData;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const defaultStatus = getNextSafeStatus(ticket.status);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const formData = new FormData(event.currentTarget);
    const status = String(formData.get("status") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/technician/workspace/tickets/${encodeURIComponent(ticket.id)}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...(note ? { note } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as StatusResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to update repair progress.");
        return;
      }

      setMessage("Repair progress updated.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5">
      <p className="eyebrow">Progress</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Update repair status</h3>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Next status
          <select name="status" defaultValue={defaultStatus} required className="field-control">
            <option value="">Select allowed status</option>
            {technicianSafeStatuses.map((status) => (
              <option key={status} value={status}>
                {REPAIR_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Status note optional
          <textarea
            name="note"
            rows={4}
            className="field-control"
            placeholder="Short context for the status change."
          />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Updating..." : "Update progress"}
      </button>
    </form>
  );
}
