import { redirect } from "next/navigation";
import { AppShell } from "@/app/app-shell";
import { TechnicianWorkspace } from "@/components/service-desk/technician-workspace";
import { getCurrentServerUser } from "@/lib/auth/server-user";

export default async function TechnicianWorkspacePage() {
  const user = await getCurrentServerUser();

  if (!user) {
    redirect("/auth/login?next=/technician/workspace");
  }

  if (user.role !== "TECHNICIAN" && user.role !== "LEAD_TECHNICIAN" && user.role !== "ADMIN") {
    redirect("/profile?denied=technician-workspace");
  }

  return (
    <AppShell active="technician" eyebrow="Technician workspace" title="Assigned repair work" user={user}>
      <TechnicianWorkspace />
    </AppShell>
  );
}
