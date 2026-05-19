"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUISettings } from "@/components/UISettingsProvider";
import { useAuth } from "@/components/AuthProvider";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useUISettings();
  const { isAuthenticated, startQfSignIn, continueAsGuest, signOut, user, streak, authReady } = useAuth();

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
    router.push("/");
  }
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard" || pathname === "/progress";
  const isReflections = pathname === "/reflections" || pathname?.startsWith("/reflections/");

  const navLinks = [
    ...(isAuthenticated
      ? [
        { href: "/", label: t("navHome"), active: isHome },
        { href: "/reflections", label: t("navReflections"), active: isReflections },
        { href: "/dashboard", label: t("navDashboard"), active: isDashboard },
      ]
      : []),
  ];

  return (
    <header className="w-full border-b border-slate-200/90 bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link prefetch href="/" className="inline-flex items-center gap-3 font-serif text-lg font-semibold text-(--teal)">
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#2F6F6F" />
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-(--teal-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--teal) md:hidden"
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
            className="hidden flex-wrap items-center gap-4 text-(--teal) underline-indicators md:flex md:gap-5"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                prefetch
                aria-selected={link.active}
                href={link.href}
                className="inline-flex rounded-lg items-center gap-2 px-2 py-2 text-sm font-medium transition md:px-3"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!authReady ? null : !isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => startQfSignIn("signup")}
                className="rounded-lg bg-(--teal) px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={continueAsGuest}
                className="rounded-lg bg-(--peach-soft) px-3 py-2 text-sm font-semibold text-(--peach) transition hover:brightness-95"
              >
                Continue as Guest
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              {/* <span className="rounded-full bg-(--peach-soft) px-3 py-1 text-xs font-semibold text-(--peach)">
                🔥 {streak?.currentStreak || 0}
              </span> */}
              <button
                type="button"
                onClick={handleSignOut}
                className="cursor-pointer rounded-md bg-(--teal) border border-(--teal) px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Sign Out
              </button>
              <Link href="/dashboard">
                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-(--teal) px-2 text-xs font-semibold text-white cursor-pointer">
                  {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className={`${menuOpen ? "block" : "hidden"} md:hidden border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_18px_52px_-28px_rgba(31,41,59,0.35)] backdrop-blur`}>
        <nav className="flex flex-col gap-2 text-sm font-medium text-slate-900">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              prefetch
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 transition hover:bg-(--teal-soft)"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {!authReady ? null : !isAuthenticated ? (
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={continueAsGuest} className="w-full rounded-xl bg-(--peach-soft) px-3 py-2 text-sm font-semibold text-(--peach)">
              Continue as Guest
            </button>
            <button
              type="button"
              onClick={() => startQfSignIn("signup")}
              className="w-full rounded-md bg-(--teal) px-4 py-2 text-sm font-semibold text-white"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-600">🔥 {streak?.currentStreak || 0} days</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg bg-(--teal) px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
