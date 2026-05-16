"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ProfileCard from "@/components/dashboard/ProfileCard";
import { useAuth } from "@/components/AuthProvider";
import {
  formatInsightMonthDay,
  getDailyReflectionStreak,
  getLastReflectionDateIso,
  getMostFrequentTag,
} from "@/lib/reflections/stats";
import { getStoredReflections } from "@/lib/storage/reflections";

export default function DashboardPage() {
  const { authReady, streak: authStreak, user } = useAuth();
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    setReflections(getStoredReflections());
  }, []);

  const total = reflections.length;
  const localStreak = useMemo(() => getDailyReflectionStreak(reflections), [reflections]);
  const reflectionStreak = authStreak?.currentStreak ?? localStreak;
  const longestStreak = authStreak?.longestStreak ?? reflectionStreak;
  const topTag = useMemo(() => getMostFrequentTag(reflections), [reflections]);
  const lastIso = useMemo(() => getLastReflectionDateIso(reflections), [reflections]);
  const themeWord = topTag ? topTag.charAt(0).toUpperCase() + topTag.slice(1) : null;

  const streakHint = !authReady
    ? null
    : user?.kind === "guest"
      ? "Guest streak — saved on this device"
      : user?.kind === "user"
        ? "Synced with your account activity"
        : "Based on reflections saved on this device";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-15 sm:px-6 md:pt-20">
        <div className="flex flex-col items-center text-center">
          <h1 className="mt-6 text-5xl leading-none text-[var(--teal)] sm:text-7xl">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Your profile, reflection practice, and spiritual growth — all in one calm view.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          <ProfileCard />

          <div className="grid grid-cols-12 gap-4">
            <section className="surface-card dashboard-card col-span-full sm:col-span-6">
              <small>Milestones</small>
              <p className="dashboard-card__number">{total}</p>
              <p className="text-md font-semibold text-slate-500">Total Reflections</p>
            </section>

            <section className="surface-card dashboard-card col-span-full sm:col-span-6">
              <small>Consistency</small>
              <p className="dashboard-card__number">{authReady ? reflectionStreak : "—"}</p>
              <p className="text-md font-semibold text-slate-500">Day Streak</p>
              {streakHint ? <p className="text-xs text-slate-400">{streakHint}</p> : null}
              {longestStreak > reflectionStreak ? (
                <p className="text-xs text-slate-400">Longest: {longestStreak} days</p>
              ) : null}
            </section>

            <section className="surface-card dashboard-card col-span-full gap-6 sm:col-span-6">
              <small>Inner landscape</small>
              <div className="font-serif text-2xl font-light tabular-nums text-[var(--teal)] md:text-4xl">
                {themeWord ? (
                  <div className="flex flex-col">
                    You often reflect on
                    <span className="font-serif italic text-[var(--peach)]">{themeWord}</span>
                  </div>
                ) : (
                  "Your themes will emerge as you journal and tag your reflections."
                )}
              </div>
            </section>

            <section className="surface-card dashboard-card col-span-full gap-6 sm:col-span-6">
              <small>Recency</small>
              <div className="font-serif text-2xl font-light tabular-nums text-[var(--teal)] md:text-4xl">
                {lastIso ? (
                  <div className="flex flex-col">
                    Last reflection:{" "}
                    <span className="font-serif text-slate-500">{formatInsightMonthDay(lastIso)}</span>
                  </div>
                ) : (
                  "No reflections yet."
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 min-w-[16rem] items-center justify-center rounded-full bg-[var(--teal)] px-8 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 focus-visible:focus-ring"
          >
            + Write a New Reflection
          </Link>
          <Link
            href="/reflections"
            className="text-sm font-semibold text-slate-500 transition hover:text-[var(--teal)]"
          >
            View full history →
          </Link>
        </div>
      </main>
    </div>
  );
}
