import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
    </article>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const dashboard = await getRoleDashboard(prisma, user);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{user.role} dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Role-scoped operational summaries are computed server-side so each account only sees the dashboard data it is allowed to access.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
            >
              Profile
            </Link>
            <Link
              href="/repair-tickets"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Repair tickets
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.role === "STUDENT" || dashboard.role === "LECTURER" ? (
            <>
              <MetricCard label="Active Tickets" value={dashboard.activeTickets} />
              <MetricCard label="Unread Notifications" value={dashboard.unreadNotifications} />
              <MetricCard label="Recent History" value={dashboard.recentRepairHistory.length} />
            </>
          ) : null}

          {dashboard.role === "TECHNICIAN" ? (
            <>
              <MetricCard label="Assigned Tickets" value={dashboard.assignedTickets} />
              <MetricCard label="Daily Workload" value={dashboard.dailyWorkload} />
              <MetricCard label="Unread Notifications" value={dashboard.unreadNotifications} />
            </>
          ) : null}

          {dashboard.role === "ADMIN" ? (
            <>
              <MetricCard label="Total Tickets" value={dashboard.totalTickets} />
              <MetricCard label="Pending Assignments" value={dashboard.pendingAssignments} />
              <MetricCard label="Active Repairs" value={dashboard.activeRepairs} />
              <MetricCard label="Completed Repairs" value={dashboard.completedRepairs} />
            </>
          ) : null}
        </div>

        {dashboard.role === "STUDENT" || dashboard.role === "LECTURER" ? (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Recent repair history</h2>
            <div className="mt-4 grid gap-4">
              {dashboard.recentRepairHistory.length > 0 ? (
                dashboard.recentRepairHistory.map((ticket) => (
                  <article key={ticket.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">{ticket.ticketId}</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">{REPAIR_STATUS_LABELS[ticket.status]}</p>
                      </div>
                      <Link
                        href={`/repair-tickets/${ticket.id}`}
                        className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-alt)]"
                      >
                        View ticket
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
                  <p className="text-sm text-[var(--muted)]">No repair history yet.</p>
                </article>
              )}
            </div>
          </div>
        ) : null}

        {dashboard.role === "TECHNICIAN" ? (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Status queue</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {dashboard.statusQueue.map((item) => (
                <MetricCard key={item.status} label={item.label} value={item.count} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
