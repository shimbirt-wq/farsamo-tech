"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type RepairLogFormProps = {
  ticketId: string;
};

export function RepairLogForm({ ticketId }: RepairLogFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await fetch(`/api/repair-tickets/${ticketId}/logs`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          diagnosis: String(formData.get("diagnosis") ?? "").trim() || undefined,
          repairNotes: String(formData.get("repairNotes") ?? "").trim() || undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to add repair log.");
        return;
      }

      setMessage("Repair log added successfully.");
      router.refresh();
      form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-6">
      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Diagnosis
          <textarea
            name="diagnosis"
            rows={4}
            placeholder="Record the diagnosis or technical findings."
            className="field-control"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Repair notes
          <textarea
            name="repairNotes"
            rows={4}
            placeholder="Record the repair work completed or next action."
            className="field-control"
          />
        </label>
      </div>

      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Add repair log"}
        </button>
      </div>
    </form>
  );
}
