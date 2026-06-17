"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type NotificationListProps = {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    status: string;
    createdAt: Date;
    readAt: Date | null;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMarkRead(notificationId: string) {
    setMessage(null);
    setPendingId(notificationId);

    startTransition(async () => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to mark notification as read.");
        setPendingId(null);
        return;
      }

      setMessage("Notification marked as read.");
      setPendingId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {notifications.map((notification) => {
        const isRead = notification.status === "READ" || notification.readAt !== null;

        return (
          <article key={notification.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{notification.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{notification.message}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]">
                  {isRead ? "Read" : "Unread"}
                </span>
                {!isRead ? (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={isPending && pendingId === notification.id}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending && pendingId === notification.id ? "Saving..." : "Mark as read"}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{formatDate(new Date(notification.createdAt))}</p>
          </article>
        );
      })}
      {message ? <p className="text-sm text-[var(--muted-strong)]">{message}</p> : null}
    </div>
  );
}
