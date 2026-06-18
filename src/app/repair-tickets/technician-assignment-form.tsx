"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TechnicianAssignmentFormProps = {
  currentTechnicianId: string | null;
  technicians: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
  ticketId: string;
};

export function TechnicianAssignmentForm({
  currentTechnicianId,
  technicians,
  ticketId,
}: TechnicianAssignmentFormProps) {
  const router = useRouter();
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(currentTechnicianId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/repair-tickets/${ticketId}/assign`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          technicianId: selectedTechnicianId,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to assign technician.");
        return;
      }

      setMessage("Technician assigned successfully.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-[260px] flex-1 flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Assign technician
          <select
            value={selectedTechnicianId}
            onChange={(event) => setSelectedTechnicianId(event.target.value)}
            className="field-control"
          >
            <option value="">Select a technician</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName} ({technician.email})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isPending || selectedTechnicianId.length === 0}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Assigning..." : "Assign technician"}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}
    </form>
  );
}
