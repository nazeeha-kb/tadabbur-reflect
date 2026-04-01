"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getStoredReflections } from "@/lib/storage/reflections";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [reflections, setReflections] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setReflections(getStoredReflections());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reflections;
    return reflections.filter((item) =>
      [item.emotion, item.reflectionText, item.title].join(" ").toLowerCase().includes(normalized),
    );
  }, [query, reflections]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl text-[var(--teal)]">Past Reflections</h1>
            <p className="mt-2 text-sm text-slate-600">Your spiritual journey, captured verse by verse.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--teal)] px-5 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring"
          >
            + New Reflection
          </Link>
        </div>

        <div className="mt-6">
          <label htmlFor="search" className="sr-only">
            Search reflections
          </label>
          <input
            id="search"
            name="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="focus-ring surface-card w-full px-4 py-3 text-sm"
            placeholder="Search by emotion, title, or reflection..."
          />
        </div>

        {filtered.length === 0 ? (
          <section className="surface-card mt-8 p-10 text-center">
            <h2 className="text-3xl text-slate-800">No reflections yet</h2>
            <p className="mt-3 text-sm text-slate-600">Start your first reflection and it will appear here.</p>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Saved reflections">
            {filtered.map((item) => (
              <article key={item.id} className="surface-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="rounded-full bg-[var(--peach-soft)] px-3 py-1 text-xs font-semibold text-[var(--peach)]">
                    {item.emotion}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
                <h3 className="mt-4 text-2xl text-[var(--teal)]">{item.title || "Untitled Reflection"}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">{item.reflectionText}</p>
                <p className="mt-4 text-xs text-slate-500">"{item.ayahs?.[0]?.translation || "Quran verse"}"</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
