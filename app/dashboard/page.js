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
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 md:pt-20 pt-15">
        <div className="text-center flex flex-col items-center">
          <h1 className="mt-6 text-5xl leading-none text-[var(--teal)] sm:text-7xl">
            Your Journey
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:mx-0 mx-auto">
            A gentle overview of your reflection practice and spiritual growth.
          </p>
        </div>

        {/* <div className="mt-10 lg:items-start"> */}
        <div className="grid grid-cols-12 gap-4 pt-20 pb-10">
          {/* Total reflections */}
          <section className="surface-card dashboard-card">
            <small>Milestones</small>
            <p className="dashboard-card__number">{total}</p>
            <p className="text-md text-slate-500 font-semibold">Total Reflections</p>
          </section>
          <section className="surface-card dashboard-card">
            <small>Consistency</small>
            <p className="dashboard-card__number">{streak}</p>
            <p className="text-md text-slate-500 font-semibold">Day Streak</p>
          </section>
          <section className="surface-card dashboard-card gap-6">
            <small>Inner landscape</small>
            <p className="font-serif tabular-nums font-light text-[var(--teal)] md:text-4xl text-2xl">
              {themeWord ? (
                <div className="flex flex-col">
                  You often reflect on
                  <span className="font-serif italic text-[var(--peach)]">{themeWord}</span>
                </div>
              ) : (
                "Your themes will emerge as you journal and tag your reflections."
              )}
            </p>
          </section>
          <section className="surface-card dashboard-card gap-6">
            <small>Recency</small>
            <p className="font-serif tabular-nums font-light text-[var(--teal)] md:text-4xl text-2xl">
              {lastIso ? (
                <div className="flex flex-col">
                  Last reflection:{" "}
                  <span className="font-serif text-slate-500">{formatInsightMonthDay(lastIso)}</span>
                </div>
              ) : (
                "No reflections yet."
              )}
            </p>
          </section>
        </div>
        {/* 
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
          </aside> */}
        {/* </div> */}

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 min-w-[16rem] items-center justify-center rounded-full bg-[var(--teal)] px-8 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring shadow-lg"
          >
            + Write a New Reflection
          </Link>
          <Link href="/reflections" className="text-sm text-slate-500 transition hover:text-[var(--teal)] font-semibold">
            View full history →
          </Link>
        </div>
      </main>
    </div>
  );
}
