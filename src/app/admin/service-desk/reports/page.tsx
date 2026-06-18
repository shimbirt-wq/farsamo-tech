import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { ServiceDeskReports } from "@/components/service-desk/service-desk-reports";
import { getCurrentServerUser } from "@/lib/auth/server-user";

export default async function ServiceDeskReportsPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/admin/service-desk/reports");
  }

  if (user.role !== "ADMIN" && user.role !== "LEAD_TECHNICIAN") {
    redirect("/profile?denied=service-desk-reports");
  }

  return (
    <AppShell
      active="reports"
      eyebrow="Service desk reports"
      title="Operational reporting"
      user={user}
      actions={
        <Link href={user.role === "LEAD_TECHNICIAN" ? "/lead" : "/dashboard"} className="btn-secondary">
          {user.role === "LEAD_TECHNICIAN" ? "Command center" : "Dashboard"}
        </Link>
      }
    >
      <ServiceDeskReports />
    </AppShell>
  );
}
