"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/landing/logo";
import { MobileMenu } from "@/components/landing/mobile-menu";

const navigationItems = [
  { href: "/auth/login", label: "Sign in" },
  { href: "/auth/register", label: "Register" },
  { href: "/admin/users", label: "Admin users" },
  { href: "/devices", label: "Devices" },
  { href: "/repair-tickets", label: "Repair tickets" }
] as const;

function ApiHealthButton() {
  return (
    <Link
      href="/api/health"
      className="inline-flex h-12 items-center gap-3 rounded-[12px] bg-[linear-gradient(135deg,#0F766E,_#10B981)] px-6 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(16,185,129,0.24)] transition duration-200 hover:brightness-105"
    >
      <span>API health</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M2 13h4l2.2-5 3.6 10L14 13h3l1.6-3 1.4 3H22"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </Link>
  );
}

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 h-[72px] border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-[1fr_auto] items-center px-4 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center">
            <Logo />
          </div>

          <nav className="hidden items-center justify-center gap-10 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[15px] font-semibold text-[#0F172A] transition-colors duration-200 hover:text-[#0F766E]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end lg:flex">
            <ApiHealthButton />
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F172A] transition duration-200 hover:text-[#0F766E] lg:hidden"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu items={[...navigationItems]} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
