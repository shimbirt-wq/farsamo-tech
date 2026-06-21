"use client";

import Link from "next/link";

import { Logo } from "@/components/landing/logo";

type NavigationItem = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ items, isOpen, onClose }: MobileMenuProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition duration-200 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Mobile navigation"
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col border-l border-slate-200 bg-white px-6 pb-6 pt-5 shadow-[-20px_0_60px_rgba(15,23,42,0.12)] transition-transform duration-200 lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Logo compact />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition duration-200 hover:bg-slate-100"
            aria-label="Close navigation menu"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
              <path
                d="m5 5 10 10M15 5 5 15"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="px-2 py-3 text-base font-semibold text-[#0F172A] transition duration-200 hover:text-[#0F766E]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-4 border-t border-slate-200 pt-5">
          <Link
            href="/api/health"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#0F766E,_#10B981)] px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(16,185,129,0.24)] transition duration-200 hover:brightness-105"
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

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/auth/login"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-[#0F172A] transition duration-200 hover:text-[#0F766E]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-[#0F172A] transition duration-200 hover:text-[#0F766E]"
            >
              Register
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
