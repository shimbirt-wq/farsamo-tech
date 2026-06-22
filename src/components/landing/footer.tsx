import Link from "next/link";

import { SimadRepairLogo } from "@/components/brand/simad-repair-logo";

const quickLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#about-us", label: "About Us" }
] as const;

const resources = [
  { href: "/#help-center", label: "Help Center" },
  { href: "/#it-policies", label: "IT Policies" },
  { href: "/#guidelines", label: "Guidelines" },
  { href: "/#announcements", label: "Announcements" },
  { href: "/#status", label: "Status Page" }
] as const;

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s6-4.8 6-11a6 6 0 1 0-12 0c0 6.2 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer
      id="support"
      className="relative scroll-mt-[100px] overflow-hidden bg-[#071B3A] px-4 pb-8 pt-16 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[260px] bg-[radial-gradient(circle,_rgba(29,78,216,0.18)_1px,_transparent_1px)] bg-[length:10px_10px] opacity-40" />
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <SimadRepairLogo variant="light" className="h-10 w-auto" />
            <p className="mt-8 max-w-[280px] text-[18px] leading-8 text-[#D6E4F1]">
              Your campus IT partner for smarter support, faster service, and better digital care.
            </p>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Quick Links
            </h3>
            <ul className="mt-7 space-y-4 text-[17px] text-[#D6E4F1]">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-[#93C5FD]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Resources
            </h3>
            <ul className="mt-7 space-y-4 text-[17px] text-[#D6E4F1]">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-[#93C5FD]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Contact Information
            </h3>
            <ul className="mt-7 space-y-5 text-[17px] leading-8 text-[#D6E4F1]">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-[#93C5FD]">
                  <LocationIcon />
                </span>
                <span>Main Campus</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-[16px] text-[#C8D6E5]">
          © 2026 SIMADRepair. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
