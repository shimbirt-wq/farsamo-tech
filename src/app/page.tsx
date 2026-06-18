import Link from "next/link";

const workflowSteps = [
  "Register device",
  "Submit repair request",
  "Technician diagnosis",
  "Track until collection",
];

const roleBenefits = [
  {
    title: "Students",
    body: "Submit personal device requests, track status, and keep a repair history.",
  },
  {
    title: "Lecturers",
    body: "Register institutional or personal devices and follow maintenance progress.",
  },
  {
    title: "Technicians",
    body: "Focus on assigned tickets, diagnosis notes, repair updates, and work queues.",
  },
  {
    title: "Admins",
    body: "Monitor workload, assign technicians, manage users, and review reports.",
  },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <section className="border-b border-[var(--border)] bg-white">
        <div className="page-container">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-white">
                FT
              </span>
              <span>
                <span className="block text-base font-bold text-[var(--foreground)]">FarsamoTech</span>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Repair Hub
                </span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Link href="/auth/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Register
              </Link>
            </div>
          </nav>
        </div>
      </section>

      <section className="page-container grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <p className="eyebrow">SIMAD University repair operations</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--foreground)] sm:text-5xl">
            Centralized computer repair tracking for SIMAD University.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-strong)]">
            Submit repair requests, track device progress, manage technician workflows, and preserve repair history in
            one professional operations platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/login" className="btn-primary">
              Login
            </Link>
            <Link href="/repair-tickets" className="btn-secondary">
              Request repair
            </Link>
            <Link href="/lookup/TCK-LOCAL-0001" className="btn-ghost">
              Try ticket lookup
            </Link>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-5 py-4">
            <p className="text-sm font-bold text-[var(--foreground)]">Operations snapshot</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Live repair workflow preview</p>
          </div>
          <div className="grid gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Open tickets", "24"],
                ["In repair", "8"],
                ["Ready", "5"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white">
              {[
                ["TCK-LOCAL-0001", "Lenovo ThinkPad", "Diagnosis in Progress", "status-diagnosis"],
                ["TCK-LOCAL-0002", "Dell OptiPlex", "Registration Completed", "status-registration"],
                ["TCK-LOCAL-0003", "HP ProBook", "Ready for Collection", "status-ready"],
              ].map(([ticket, device, status, className]) => (
                <div key={ticket} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4 last:border-b-0">
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{ticket}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{device}</p>
                  </div>
                  <span className={`status-badge ${className}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-container pt-0">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="panel p-6">
            <p className="eyebrow">How it works</p>
            <div className="mt-5 grid gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roleBenefits.map((item) => (
              <article key={item.title} className="panel p-5">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="page-container">
        <div className="border-t border-[var(--border)] py-6 text-sm text-[var(--muted)]">
          FarsamoTech Repair Hub - XeelTech Solutions - SIMAD University
        </div>
      </footer>
    </main>
  );
}
