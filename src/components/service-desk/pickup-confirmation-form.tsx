"use client";

import { useRef, useState, useTransition } from "react";
import type { CustodyDetailData } from "@/components/service-desk/device-custody-panel";

type CustodyMutationResponse = {
  error?: string;
  custody?: CustodyDetailData;
};

export function PickupConfirmationForm({
  custodyDetail,
  onCustodyUpdated,
}: {
  custodyDetail: CustodyDetailData;
  onCustodyUpdated: (custody: CustodyDetailData) => void | Promise<void>;
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
    const collectedByName = String(formData.get("collectedByName") ?? "").trim();
    const collectedByPhone = String(formData.get("collectedByPhone") ?? "").trim();

    if (!window.confirm("Confirm that the device has been physically collected by the named collector?")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(custodyDetail.ticket.id)}/custody/pickup`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          collectedByName,
          ...(collectedByPhone ? { collectedByPhone } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as CustodyMutationResponse | null;

      if (!response.ok || !body?.custody) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to confirm pickup.");
        return;
      }

      formRef.current?.reset();
      setMessage("Pickup confirmed.");
      await onCustodyUpdated(body.custody);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-white p-5">
      <p className="eyebrow">Pickup</p>
      <h4 className="mt-2 text-lg font-bold text-[var(--foreground)]">Confirm collection</h4>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        Record the person collecting the device before custody is marked collected.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Collector name
          <input name="collectedByName" required className="field-control" placeholder="Full name" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Collector phone optional
          <input name="collectedByPhone" className="field-control" placeholder="+252..." />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Confirming..." : "Confirm pickup"}
      </button>
    </form>
  );
}
