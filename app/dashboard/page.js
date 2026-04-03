"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getAchievementRows, getNextMilestoneTarget } from "@/lib/reflections/achievements";
import {
  formatInsightMonthDay,
  getDailyReflectionStreak,
  getLastReflectionDateIso,
  getMostFrequentTag,
} from "@/lib/reflections/stats";
import { getStoredReflections } from "@/lib/storage/reflections";

function MilestoneRing({ current, target }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const offset = c * (1 - pct);

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-[var(--teal)]"
        />
      </svg>
      <span className="absolute text-center text-xs font-medium tabular-nums text-slate-600">
        {current} / {target}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    setReflections(getStoredReflections());
  }, []);

  const total = reflections.length;
  const streak = useMemo(() => getDailyReflectionStreak(reflections), [reflections]);
  const topTag = useMemo(() => getMostFrequentTag(reflections), [reflections]);
  const lastIso = useMemo(() => getLastReflectionDateIso(reflections), [reflections]);
  const nextTarget = useMemo(() => getNextMilestoneTarget(total), [total]);
  const achievements = useMemo(() => getAchievementRows(reflections), [reflections]);

  const themeWord = topTag ? topTag.charAt(0).toUpperCase() + topTag.slice(1) : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 sm:px-6 pt-20">
        <div className="text-center sm:text-left">
          <h1 className="font-serif text-4xl text-[var(--teal)] sm:text-5xl">Your Journey</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:mx-0 mx-auto">
            A gentle overview of your reflection practice and spiritual growth.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="grid grid-cols-2 gap-4 lg:col-span-7">
            <section className="surface-card flex flex-col justify-between rounded-3xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Milestones</p>
              <p className="mt-4 font-serif text-4xl tabular-nums text-[var(--teal)]">{total}</p>
              <p className="mt-2 text-sm text-slate-600">Total Reflections</p>
            </section>
            <section className="surface-card flex flex-col justify-between rounded-3xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Consistency</p>
              <p className="mt-4 font-serif text-4xl tabular-nums text-[var(--teal)]">{streak}</p>
              <p className="mt-2 text-sm text-slate-600">Day Streak</p>
            </section>
            <section className="surface-card flex flex-col justify-between rounded-3xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Inner landscape</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                {themeWord ? (
                  <>
                    You often reflect on{" "}
                    <span className="font-serif italic text-[var(--peach)]">{themeWord}</span>.
                  </>
                ) : (
                  "Your themes will emerge as you journal and tag your reflections."
                )}
              </p>
            </section>
            <section className="surface-card flex flex-col justify-between rounded-3xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Recency</p>
              <p className="mt-4 text-sm text-slate-700 sm:text-base">
                {lastIso ? (
                  <>
                    Last reflection:{" "}
                    <span className="font-serif text-slate-500">{formatInsightMonthDay(lastIso)}</span>
                  </>
                ) : (
                  "No reflections yet."
                )}
              </p>
            </section>
          </div>

          <aside className="surface-card flex flex-col rounded-3xl p-6 lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Next milestone</p>
            <div className="mt-6 flex flex-col items-center">
              <MilestoneRing current={total} target={nextTarget} />
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-1.5 text-xs text-slate-600">
                <span aria-hidden>✦</span> You&apos;re building a beautiful habit.
              </p>
            </div>
            <hr className="my-8 border-[var(--border-soft)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Achievements</p>
            <ul className="mt-5 grid grid-cols-3 gap-4 text-center">
              {achievements.map((a) => (
                <li key={a.id} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
                      a.unlocked
                        ? a.tone === "peach"
                          ? "bg-[var(--peach-soft)] text-[var(--peach)]"
                          : a.tone === "sky"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-[var(--teal-soft)] text-[var(--teal)]"
                        : "bg-slate-100 text-slate-300"
                    }`}
                    aria-hidden
                  >
                    {a.id === "first" ? "🏆" : a.id.includes("streak") ? "⚡" : "〰"}
                  </div>
                  <span className={`text-[10px] leading-tight sm:text-[11px] ${a.unlocked ? "text-slate-600" : "text-slate-400"}`}>
                    {a.label}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 min-w-[16rem] items-center justify-center rounded-full bg-[var(--teal)] px-8 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring"
          >
            + Write a New Reflection
          </Link>
          <Link href="/reflections" className="text-sm text-slate-500 transition hover:text-[var(--teal)]">
            View full history →
          </Link>
        </div>
      </main>
    </div>
  );
}
