"use client";

import Link from "next/link";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="XeelTech home"
      className="group inline-flex items-center gap-3 transition-colors duration-200"
    >
      <span className="flex h-10 w-10 items-center justify-center text-[#0F766E] transition-transform duration-200 group-hover:scale-105">
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-10 w-10"
        >
          <path
            d="M32 4 53.65 16.5v31L32 60 10.35 47.5v-31L32 4Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M32 10.8 47.75 19.9v22.2L32 51.2 16.25 42.1V19.9L32 10.8Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="m24.5 24.5 15 15m0-15-15 15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </svg>
      </span>
      <span
        className={`text-[20px] font-bold tracking-[-0.03em] text-[#0F172A] transition-colors duration-200 group-hover:text-[#0F766E] ${
          compact ? "hidden sm:inline-flex" : "inline-flex"
        }`}
      >
        XEELTECH
      </span>
    </Link>
  );
}
