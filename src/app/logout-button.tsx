"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/auth/login");
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending} className="ops-nav-link w-full text-left disabled:opacity-60">
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
