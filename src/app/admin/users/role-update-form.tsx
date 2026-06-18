"use client";

import { UserRole } from "@prisma/client";
import { useState, useTransition } from "react";

type RoleUpdateFormProps = {
  currentIsActive: boolean;
  currentRole: UserRole;
  userId: string;
};

export function RoleUpdateForm({ currentIsActive, currentRole, userId }: RoleUpdateFormProps) {
  const [isActive, setIsActive] = useState(currentIsActive);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole, isActive }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Unable to update the user access.");
        return;
      }

      setMessage("User access updated successfully.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
          Role
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as UserRole)}
            className="field-control"
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Active account
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save access"}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--muted-strong)]">{message}</p> : null}
    </form>
  );
}
