"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isReflections = pathname === "/reflections" || pathname?.startsWith("/reflections/");

  return (
    <header className="w-full border-b border-slate-200/90 bg-[var(--background)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5 font-serif text-lg font-semibold text-[var(--teal)]">
          <span className="inline-flex h-8 w-8 shrink-0 rounded-full bg-[var(--teal)]" aria-hidden />
          <span>Quran Reflect</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/reflections"
              className={`focus-visible:focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-3.5 ${
                isReflections
                  ? "bg-[var(--teal-soft)] text-[var(--teal)] ring-1 ring-[var(--teal)]/25"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-[var(--teal)] ring-1 ring-[var(--teal)]/25"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 opacity-80"
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
            <Link
              href="/dashboard"
              className={`focus-visible:focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-3.5 ${
                isDashboard
                  ? "bg-[var(--teal-soft)] text-[var(--teal)] ring-1 ring-[var(--teal)]/25"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-[var(--teal)] ring-1 ring-[var(--teal)]/25"
              }`}
            >
              <svg
                className="h-4 w-4 shrink-0 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Dashboard
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
      </div>
    </header>
  );
}
