"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type RegisterState = {
  error: string | null;
};

const initialState: RegisterState = {
  error: null,
};

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      universityId: String(formData.get("universityId") ?? "").trim(),
      faculty: String(formData.get("faculty") ?? "").trim(),
      department: String(formData.get("department") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "STUDENT"),
    };

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setState({
          error: body?.error ?? "Unable to create the account.",
        });
        return;
      }

      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-8">
      <p className="eyebrow">Create account</p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Register a new user</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Full name
          <input name="fullName" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          University ID
          <input name="universityId" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Faculty
          <input name="faculty" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Department
          <input name="department" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Phone
          <input name="phone" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Role
          <select name="role" defaultValue="STUDENT" className="field-control">
            <option value="STUDENT">STUDENT</option>
            <option value="LECTURER">LECTURER</option>
            <option value="TECHNICIAN">TECHNICIAN</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)] sm:col-span-2">
          Email
          <input type="email" name="email" required className="field-control" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)] sm:col-span-2">
          Password
          <input type="password" name="password" required className="field-control" />
        </label>
      </div>

      {state.error ? <p className="mt-4 text-sm text-[#9f2c2c]">{state.error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create account"}
        </button>
        <Link
          href="/auth/login"
          className="btn-secondary"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
