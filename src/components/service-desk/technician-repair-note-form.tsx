"use client";

import { useRef, useState, useTransition } from "react";
import type { TechnicianTicketDetailData } from "@/components/service-desk/technician-ticket-detail";

type RepairNoteResponse = {
  error?: string;
  ticket?: TechnicianTicketDetailData;
};

export function TechnicianRepairNoteForm({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: TechnicianTicketDetailData) => void;
  ticket: TechnicianTicketDetailData;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const formData = new FormData(event.currentTarget);
    const diagnosis = String(formData.get("diagnosis") ?? "").trim();
    const repairNotes = String(formData.get("repairNotes") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/technician/workspace/tickets/${encodeURIComponent(ticket.id)}/notes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...(diagnosis ? { diagnosis } : {}),
          ...(repairNotes ? { repairNotes } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as RepairNoteResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to add repair note.");
        return;
      }

      formRef.current?.reset();
      setMessage("Repair note added.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="panel p-5">
      <p className="eyebrow">Repair notes</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Record diagnosis or repair work</h3>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Diagnosis
          <textarea
            name="diagnosis"
            rows={4}
            className="field-control"
            placeholder="Fault found, diagnostic result, or suspected cause."
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Repair notes
          <textarea
            name="repairNotes"
            rows={4}
            className="field-control"
            placeholder="Work performed, attempted fix, or next repair step."
          />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Adding..." : "Add repair note"}
      </button>
    </form>
  );
}
