"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUISettings } from "@/components/UISettingsProvider";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useUISettings();
  const isHome = pathname === "/";
  const isProgress = pathname === "/progress";
  const isReflections = pathname === "/reflections" || pathname?.startsWith("/reflections/");

  const navLinks = [
    { href: "/", label: t("navHome"), active: isHome },
    { href: "/reflections", label: t("navReflections"), active: isReflections },
    { href: "/progress", label: t("navProgress"), active: isProgress },
  ];

  return (
    <header className="w-full border-b border-slate-200/90 bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3 font-serif text-lg font-semibold text-(--teal)">
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="24" fill="#2F6F6F" />
              <text x="50%" y="55%" textAnchor="middle" fill="white" fontSize="20" fontFamily="serif" dy=".3em">
                T
              </text>
            </svg>
            <span>Tadabbur</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-(--teal-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--teal) sm:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          <nav
            id="primary-navigation"
            aria-label="Primary navigation"
            className="hidden flex-wrap items-center gap-2 text-(--teal) underline-indicators sm:flex sm:gap-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                aria-selected={link.active}
                href={link.href}
                className="inline-flex rounded-lg items-center gap-2 px-3 py-2 text-sm font-medium transition sm:px-3.5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--teal) text-sm font-semibold text-white"
            title="Profile"
            aria-hidden
          >
            M
          </div> */}
          {/* <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--teal)"
          >
            Login
          </Link> */}
        </div>
      </div>

      <div className={`${menuOpen ? "block" : "hidden"} sm:hidden border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_18px_52px_-28px_rgba(31,41,59,0.35)] backdrop-blur`}>
        <nav className="flex flex-col gap-2 text-sm font-medium text-slate-900">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 transition hover:bg-(--teal-soft)"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
