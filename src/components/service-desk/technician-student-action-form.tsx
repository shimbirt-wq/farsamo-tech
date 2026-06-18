"use client";

import { useState, useTransition } from "react";
import type { TechnicianTicketDetailData } from "@/components/service-desk/technician-ticket-detail";

type StudentActionResponse = {
  error?: string;
  ticket?: TechnicianTicketDetailData;
};

export function TechnicianStudentActionForm({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: TechnicianTicketDetailData) => void;
  ticket: TechnicianTicketDetailData;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const formData = new FormData(event.currentTarget);
    const studentActionRequired = String(formData.get("studentActionRequired") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(
        `/api/technician/workspace/tickets/${encodeURIComponent(ticket.id)}/request-student-action`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ studentActionRequired }),
        },
      );
      const body = (await response.json().catch(() => null)) as StudentActionResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to request student action.");
        return;
      }

      setMessage("Student action request saved.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5">
      <p className="eyebrow">Requester action</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Request student action</h3>

      <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
        Needed from requester
        <textarea
          name="studentActionRequired"
          defaultValue={ticket.studentActionRequired ?? ""}
          rows={5}
          required
          className="field-control"
          placeholder="Information, charger, password, part decision, or other action needed."
        />
      </label>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Saving..." : "Request action"}
      </button>
    </form>
  );
}
