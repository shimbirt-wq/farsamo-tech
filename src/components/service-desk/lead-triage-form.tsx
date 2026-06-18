"use client";

import { useState, useTransition } from "react";
import {
  REPAIR_METHOD_LABELS,
  SEVERITY_LABELS,
} from "@/lib/service-desk/constants";
import type { LeadTicketDetailData } from "@/components/service-desk/lead-ticket-detail";

type TriageResponse = {
  error?: string;
  ticket?: LeadTicketDetailData;
};

const severityOptions = Object.entries(SEVERITY_LABELS);
const repairMethodOptions = Object.entries(REPAIR_METHOD_LABELS);

export function LeadTriageForm({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: LeadTicketDetailData) => void;
  ticket: LeadTicketDetailData;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const formData = new FormData(event.currentTarget);
    const severity = String(formData.get("severity") ?? "");
    const repairMethod = String(formData.get("repairMethod") ?? "");
    const triageNotes = String(formData.get("triageNotes") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticket.id)}/triage`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          severity,
          repairMethod,
          ...(triageNotes ? { triageNotes } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as TriageResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to update triage.");
        return;
      }

      setMessage("Triage updated.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5">
      <p className="eyebrow">Triage</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Set repair path</h3>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Severity
          <select name="severity" defaultValue={ticket.severity ?? ""} required className="field-control">
            <option value="">Select severity</option>
            {severityOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Repair method
          <select name="repairMethod" defaultValue={ticket.repairMethod ?? ""} required className="field-control">
            <option value="">Select method</option>
            {repairMethodOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Triage notes optional
          <textarea
            name="triageNotes"
            defaultValue={ticket.triageNotes ?? ""}
            rows={4}
            className="field-control"
            placeholder="Internal lead technician notes for routing and repair context."
          />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <button type="submit" disabled={isPending} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Saving..." : "Save triage"}
        </button>
      </div>
    </form>
  );
}
