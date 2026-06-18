import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { LeadCommandCenter } from "@/components/service-desk/lead-command-center";
import { getCurrentServerUser } from "@/lib/auth/server-user";

export default async function LeadCommandCenterPage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/lead");
  }

  if (user.role !== "LEAD_TECHNICIAN" && user.role !== "ADMIN") {
    redirect("/profile?denied=lead-command");
  }

  return (
    <AppShell active="lead" eyebrow="Lead technician" title="Command center" user={user}>
      <LeadCommandCenter />
    </AppShell>
  );
}
