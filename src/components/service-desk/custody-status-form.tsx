"use client";

import { useState, useTransition } from "react";
import type { CustodyDetailData } from "@/components/service-desk/device-custody-panel";
import { CUSTODY_STATUS_LABELS } from "@/lib/service-desk/constants";

type CustodyMutationResponse = {
  error?: string;
  custody?: CustodyDetailData;
};

const nextCustodyStatus: Record<string, string | null> = {
  RECEIVED: "IN_REPAIR_ROOM",
  IN_REPAIR_ROOM: "READY_FOR_COLLECTION",
  READY_FOR_COLLECTION: null,
  COLLECTED: null,
  NOT_RECEIVED: null,
};

function formatCustody(status: string) {
  return CUSTODY_STATUS_LABELS[status as keyof typeof CUSTODY_STATUS_LABELS] ?? status.replaceAll("_", " ");
}

export function CustodyStatusForm({
  custodyDetail,
  onCustodyUpdated,
}: {
  custodyDetail: CustodyDetailData;
  onCustodyUpdated: (custody: CustodyDetailData) => void | Promise<void>;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const currentStatus = custodyDetail.custody?.status ?? "NOT_RECEIVED";
  const nextStatus = nextCustodyStatus[currentStatus] ?? null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!nextStatus) {
      setIsError(true);
      setMessage("No next custody move is available from the current status.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const note = String(formData.get("note") ?? "").trim();

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(custodyDetail.ticket.id)}/custody/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          ...(note ? { note } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as CustodyMutationResponse | null;

      if (!response.ok || !body?.custody) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to update custody status.");
        return;
      }

      setMessage(`Custody moved to ${formatCustody(nextStatus)}.`);
      await onCustodyUpdated(body.custody);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-white p-5">
      <p className="eyebrow">Custody movement</p>
      <h4 className="mt-2 text-lg font-bold text-[var(--foreground)]">Move physical device</h4>

      <div className="mt-5 grid gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Next allowed move</p>
          <p className="mt-2 text-sm font-bold text-[var(--foreground)]">
            {nextStatus ? `${formatCustody(currentStatus)} -> ${formatCustody(nextStatus)}` : "No custody move available"}
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Movement note optional
          <textarea name="note" rows={3} className="field-control" placeholder="Storage move, shelf change, or ready-for-collection context." />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !nextStatus}
        className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Moving..." : nextStatus ? `Move to ${formatCustody(nextStatus)}` : "No move available"}
      </button>
    </form>
  );
}
