"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2.5 font-serif text-lg font-semibold text-[var(--teal)]">
        <span className="inline-flex h-8 w-8 shrink-0 rounded-full bg-[var(--teal)]" aria-hidden />
        <span>Quran Reflect</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <nav aria-label="Primary navigation">
          <Link
            href="/dashboard"
            className={`focus-visible:focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-semibold shadow-sm transition sm:px-6 ${
              isDashboard
                ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                : "border-[var(--border)] bg-white text-[var(--teal)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]"
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0 opacity-90"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" />
              <path d="M8 7h8M8 11h6" strokeLinecap="round" />
            </svg>
            My Reflections
          </Link>
        </nav>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--teal)] text-sm font-semibold text-white"
          title="Profile"
          aria-hidden
        >
          M
        </div>
      </div>
    </header>
  );
}
