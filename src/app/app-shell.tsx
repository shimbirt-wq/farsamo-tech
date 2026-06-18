import Link from "next/link";
import type { PublicUser } from "@/lib/auth/public-user";
import { LogoutButton } from "@/app/logout-button";

type AppShellProps = {
  active: "dashboard" | "lead" | "technician" | "tickets" | "devices" | "reports" | "users" | "profile";
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  user: PublicUser;
};

function getNavItems(user: PublicUser) {
  const shared = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard" },
    { key: "tickets", href: "/repair-tickets", label: user.role === "TECHNICIAN" ? "Assigned Tickets" : "My Tickets" },
    { key: "devices", href: "/devices", label: "Devices" },
    { key: "profile", href: "/profile", label: "Profile" },
  ] as const;

  if (user.role !== "ADMIN") {
    return user.role === "LEAD_TECHNICIAN"
      ? [
          { key: "dashboard", href: "/dashboard", label: "Dashboard" },
          { key: "lead", href: "/lead", label: "Lead Command" },
          { key: "technician", href: "/technician/workspace", label: "Workspace" },
          { key: "tickets", href: "/repair-tickets", label: "Tickets" },
          { key: "devices", href: "/devices", label: "Devices" },
          { key: "reports", href: "/admin/service-desk/reports", label: "Reports" },
          { key: "profile", href: "/profile", label: "Profile" },
        ]
      : user.role === "TECHNICIAN"
        ? [
            { key: "dashboard", href: "/dashboard", label: "Dashboard" },
            { key: "technician", href: "/technician/workspace", label: "Workspace" },
            { key: "tickets", href: "/repair-tickets", label: "Assigned Tickets" },
            { key: "devices", href: "/devices", label: "Devices" },
            { key: "profile", href: "/profile", label: "Profile" },
          ]
      : shared;
  }

  return [
    { key: "dashboard", href: "/dashboard", label: "Dashboard" },
    { key: "lead", href: "/lead", label: "Lead Command" },
    { key: "technician", href: "/technician/workspace", label: "Workspace" },
    { key: "tickets", href: "/repair-tickets", label: "Tickets" },
    { key: "devices", href: "/admin/devices", label: "Devices" },
    { key: "users", href: "/admin/users", label: "Users" },
    { key: "reports", href: "/admin/service-desk/reports", label: "Reports" },
    { key: "profile", href: "/profile", label: "Profile" },
  ] as const;
}

export function AppShell({ active, actions, children, eyebrow, title, user }: AppShellProps) {
  const navItems = getNavItems(user);

  return (
    <main className="ops-shell">
      <div className="ops-layout">
        <aside className="ops-sidebar">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-300/30 bg-white/10 text-sm font-black text-white">
              FT
            </span>
            <span>
              <span className="block text-sm font-extrabold text-white">FarsamoTech</span>
              <span className="block text-xs font-semibold text-blue-200">Repair Hub</span>
            </span>
          </Link>

          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`ops-nav-link ${active === item.key ? "ops-nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </aside>

        <section className="ops-main">
          <header className="ops-topbar">
            <div>
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {actions}
              <div className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm">
                <span className="font-bold text-[var(--foreground)]">{user.fullName}</span>
                <span className="ml-2 text-[var(--muted)]">{user.role}</span>
              </div>
            </div>
          </header>
          <div className="ops-content">{children}</div>
        </section>
      </div>
    </main>
  );
}
