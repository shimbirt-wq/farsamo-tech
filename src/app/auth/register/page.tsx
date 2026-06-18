import { RegisterForm } from "@/app/auth/register/register-form";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";

export default function RegisterPage() {
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main className="app-shell">
      <div className="page-container grid min-h-screen content-center gap-6">
        {runtimeIssue ? (
          <section className="rounded-2xl border border-[#fecaca] bg-[var(--danger-bg)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9f2c2c]">Configuration required</p>
            <p className="mt-3 text-sm leading-7 text-[#7b2323]">{runtimeIssue}</p>
          </section>
        ) : null}
        <RegisterForm />
      </div>
    </main>
  );
}
