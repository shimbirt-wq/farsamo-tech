import { LandingNavbar } from "@/components/landing/navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eff7f5_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <LandingNavbar />
    </main>
  );
}
