import Link from "next/link";
import { redirect } from "next/navigation";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { prisma } from "@/lib/db/prisma";
import { listDevices } from "@/lib/devices/device-service";
import { listOwnedRepairTickets } from "@/lib/repair-tickets/repair-ticket-service";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { RepairTicketForm } from "@/app/repair-tickets/repair-ticket-form";

export default async function RepairTicketsPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/repair-tickets");
  }

  if (user.role !== "STUDENT" && user.role !== "LECTURER") {
    redirect("/profile");
  }

  const [deviceResult, tickets] = await Promise.all([
    listDevices(prisma, user, {
      page: 1,
      pageSize: 25,
      query: undefined,
      ownerId: user.id,
    }),
    listOwnedRepairTickets(prisma, user),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <RepairTicketForm
          devices={deviceResult.devices.map((device) => ({
            id: device.id,
            brand: device.brand,
            model: device.model,
            deviceType: device.deviceType,
          }))}
        />

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">My tickets</p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Recent repair requests</h1>
            </div>
            <Link
              href="/devices"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              My devices
            </Link>
          </div>

          <div className="mt-8 grid gap-4">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">{ticket.ticketId}</h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {ticket.device.brand} {ticket.device.model}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                      {REPAIR_STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{ticket.issueDescription}</p>
                </article>
              ))
            ) : (
              <article className="rounded-3xl border border-[var(--border)] bg-white p-5">
                <p className="text-sm text-[var(--muted)]">
                  No repair tickets yet. Submit one for a registered device to get started.
                </p>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
