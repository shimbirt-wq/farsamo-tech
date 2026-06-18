"use client";

import { useRef, useState, useTransition } from "react";
import type { CustodyDetailData } from "@/components/service-desk/device-custody-panel";

type CustodyMutationResponse = {
  error?: string;
  custody?: CustodyDetailData;
};

function parseLineList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function DeviceCheckInForm({
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
    const condition = String(formData.get("condition") ?? "").trim();
    const screenCondition = String(formData.get("screenCondition") ?? "").trim();
    const keyboardCondition = String(formData.get("keyboardCondition") ?? "").trim();
    const batteryCondition = String(formData.get("batteryCondition") ?? "").trim();
    const bodyCondition = String(formData.get("bodyCondition") ?? "").trim();
    const storageLocation = String(formData.get("storageLocation") ?? "").trim();
    const accessories = parseLineList(String(formData.get("accessories") ?? ""));
    const checkInPhotoUrls = parseLineList(String(formData.get("checkInPhotoUrls") ?? ""));

    startTransition(async () => {
      const response = await fetch(`/api/lead/tickets/${encodeURIComponent(custodyDetail.ticket.id)}/custody`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...(condition ? { condition } : {}),
          ...(screenCondition ? { screenCondition } : {}),
          ...(keyboardCondition ? { keyboardCondition } : {}),
          ...(batteryCondition ? { batteryCondition } : {}),
          ...(bodyCondition ? { bodyCondition } : {}),
          ...(accessories.length > 0 ? { accessories } : {}),
          storageLocation,
          ...(checkInPhotoUrls.length > 0 ? { checkInPhotoUrls } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as CustodyMutationResponse | null;

      if (!response.ok || !body?.custody) {
        setIsError(true);
        setMessage(body?.error ?? "Unable to check in device.");
        return;
      }

      formRef.current?.reset();
      setMessage("Device checked in.");
      await onCustodyUpdated(body.custody);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-white p-5">
      <p className="eyebrow">Check-in</p>
      <h4 className="mt-2 text-lg font-bold text-[var(--foreground)]">Receive device</h4>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Storage location
          <input name="storageLocation" required className="field-control" placeholder="Shelf A3, Cabinet B2, repair bench" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          General condition
          <textarea name="condition" rows={3} className="field-control" placeholder="Overall condition at handover." />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <input name="screenCondition" className="field-control" placeholder="Screen condition" />
          <input name="keyboardCondition" className="field-control" placeholder="Keyboard condition" />
          <input name="batteryCondition" className="field-control" placeholder="Battery condition" />
          <input name="bodyCondition" className="field-control" placeholder="Body condition" />
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Accessories
          <textarea name="accessories" rows={3} className="field-control" placeholder="Charger, mouse, bag" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Check-in photo URLs optional
          <textarea name="checkInPhotoUrls" rows={3} className="field-control" placeholder="One URL per line. Internal storage URLs only." />
        </label>
      </div>

      {message ? (
        <p className={`mt-4 text-sm font-medium ${isError ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {message}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Checking in..." : "Check in device"}
      </button>
    </form>
  );
}
