"use client";

import { useEffect, useState, useTransition } from "react";
import type { LeadTicketDetailData } from "@/components/service-desk/lead-ticket-detail";

type TechnicianOption = {
  id: string;
  fullName: string;
  role: string;
};

type TechniciansResponse = {
  error?: string;
  technicians?: TechnicianOption[];
};

type AssignmentResponse = {
  error?: string;
  ticket?: LeadTicketDetailData;
};

export function LeadAssignmentForm({
  onTicketUpdated,
  ticket,
}: {
  onTicketUpdated: (ticket: LeadTicketDetailData) => void;
  ticket: LeadTicketDetailData;
}) {
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadTechnicians() {
      const response = await fetch("/api/lead/technicians", { method: "GET" });
      const body = (await response.json().catch(() => null)) as TechniciansResponse | null;

      if (!isMounted) {
        return;
      }

      if (!response.ok || !body?.technicians) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to load technicians.");
        return;
      }

      setTechnicians(body.technicians);
    }

    loadTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    const formData = new FormData(event.currentTarget);
    const technicianId = String(formData.get("technicianId") ?? "");

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(ticket.id)}/assign`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ technicianId }),
      });
      const body = (await response.json().catch(() => null)) as AssignmentResponse | null;

      if (!response.ok || !body?.ticket) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to assign technician.");
        return;
      }

      setMessage("Technician assigned.");
      onTicketUpdated(body.ticket);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-5">
      <p className="eyebrow">Assignment</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--foreground)]">Assign repair owner</h3>

      <div className="mt-5 grid gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Current assignment</p>
          <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
            {ticket.technician ? `${ticket.technician.fullName} - ${ticket.technician.role}` : "Unassigned"}
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Technician
          <select name="technicianId" defaultValue={ticket.technician?.id ?? ""} required className="field-control">
            <option value="">Select technician</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName} ({technician.role})
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isPending || technicians.length === 0}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Assigning..." : "Assign technician"}
        </button>
      </div>
    </form>
  );
}
