"use client";

import Link from "next/link";
import { useUISettings } from "@/components/UISettingsProvider";
import { useAuth } from "@/components/AuthProvider";

export default function SiteFooter() {
  const { t } = useUISettings();
  const { isAuthenticated, authReady } = useAuth();
  const year = new Date().getFullYear();

  const navLinks = [
    { href: "/", label: t("navHome") },
    ...(authReady && isAuthenticated
      ? [
          { href: "/reflections", label: t("navReflections") },
          { href: "/dashboard", label: t("navDashboard") },
        ]
      : []),
  ];

  return (
    <footer className="mt-auto w-full border-t border-slate-200/90 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 font-serif text-lg font-semibold text-(--teal)">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-(--teal) text-sm font-semibold text-white"
                aria-hidden
              >
                T
              </span>
              Tadabbur
            </Link>
            <p className="text-sm leading-relaxed text-slate-600">
              A calm space to reflect on Quranic guidance, journal your thoughts, and grow your daily streak.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 gap-y-4 sm:justify-end">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 transition hover:text-(--teal)"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Tadabbur. All rights reserved.</p>
          <p className="text-slate-400">Reflect with intention. Grow with consistency.</p>
        </div>
      </div>
    </footer>
  );
}
