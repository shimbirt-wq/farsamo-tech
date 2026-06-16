import { REPAIR_STATUS_FLOW, REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

const roleCards = [
  {
    title: "Students and Lecturers",
    description: "Submit repair requests, register devices, and track every step from diagnosis to collection.",
  },
  {
    title: "Technicians",
    description: "Manage assigned tickets, update repair progress, add diagnosis notes, and record repair work.",
  },
  {
    title: "Admins",
    description: "Assign technicians, monitor workload, review reports, and understand recurring device issues.",
  },
];

const metrics = [
  { label: "Repair requests", value: "Centralized" },
  { label: "Tracking method", value: "Ticket ID + QR" },
  { label: "Database", value: "Supabase PostgreSQL" },
  { label: "Stack", value: "Next.js + Prisma" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                XeelTech Solutions
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                FarsamoTech Repair Hub
              </h1>
            </div>
            <a
              href="/api/health"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              API health
            </a>
          </nav>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="max-w-3xl text-lg leading-8 text-slate-700">
                A full-stack repair management platform for SIMAD University, built to replace manual
                registration and spreadsheet tracking with structured tickets, repair timelines,
                technician workflows, and admin analytics.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Role Workspaces</h2>
          <div className="mt-5 grid gap-4">
            {roleCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-950">Repair Journey</h2>
          <ol className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            {REPAIR_STATUS_FLOW.map((status, index) => (
              <li key={status} className="flex gap-4 border-b border-slate-100 py-3 last:border-b-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{REPAIR_STATUS_LABELS[status]}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {index === 0
                      ? "The request is registered and a ticket ID is generated."
                      : "Progress is saved to the ticket timeline for transparent tracking."}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
