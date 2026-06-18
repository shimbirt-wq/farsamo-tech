import Link from "next/link";
import { AppShell } from "@/app/app-shell";
import { redirect } from "next/navigation";
import { getCurrentServerUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { getRoleDashboard } from "@/lib/dashboard/dashboard-service";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";
import { StatusBadge } from "@/app/repair-tickets/status-badge";

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="panel p-5">
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
    <AppShell
      active="dashboard"
      eyebrow="Dashboard"
      title={`${user.role} dashboard`}
      user={user}
      actions={
        <>
            <Link
              href="/profile"
              className="btn-secondary"
            >
              Profile
            </Link>
            <Link
              href="/repair-tickets"
              className="btn-primary"
            >
              Repair tickets
            </Link>
        </>
      }
    >
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Role-scoped operational summaries are computed server-side so each account only sees the dashboard data it is allowed to access.
        </p>

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
                  <article key={ticket.id} className="panel p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">{ticket.ticketId}</p>
                        <div className="mt-2">
                          <StatusBadge status={ticket.status} />
                        </div>
                      </div>
                      <Link
                        href={`/repair-tickets/${ticket.id}`}
                        className="btn-secondary"
                      >
                        View ticket
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel p-5">
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
                <article key={item.status} className="panel p-5">
                  <StatusBadge status={item.status} />
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{item.count}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{REPAIR_STATUS_LABELS[item.status]}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
    </AppShell>
  );
}
