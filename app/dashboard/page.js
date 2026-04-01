"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import { getStoredReflections } from "@/lib/storage/reflections";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ayahCapsuleLabel(ayah) {
  if (!ayah || typeof ayah !== "object") return "";
  if (ayah.verseKey) return String(ayah.verseKey);
  const name = ayah.surahName?.trim() || "Verse";
  const n = ayah.ayahNumber;
  if (n != null && n !== "") return `${name} · ${n}`;
  return name;
}

function reflectionSearchBlob(item) {
  const ayahParts = (item.ayahs || []).flatMap((a) =>
    [a.translation, a.arabicText, a.surahName, String(a.ayahNumber ?? "")].filter(Boolean),
  );
  const tagStr = (item.tags || []).join(" ");
  return [item.emotion, item.title, item.reflectionText, tagStr, ...ayahParts].join(" ").toLowerCase();
}

export default function DashboardPage() {
  const [reflections, setReflections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    setReflections(getStoredReflections());
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFiltersOpen(false);
      }
    }
    if (filtersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen]);

  const allTags = useMemo(() => {
    const s = new Set();
    reflections.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [reflections]);

  const filtered = useMemo(() => {
    let list = reflections;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => reflectionSearchBlob(item).includes(q));
    }

    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      list = list.filter((item) => new Date(item.createdAt) >= d);
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      list = list.filter((item) => new Date(item.createdAt) <= d);
    }

    if (selectedTags.length > 0) {
      list = list.filter((item) => {
        const have = new Set(item.tags || []);
        return selectedTags.every((st) => have.has(st));
      });
    }

    return list;
  }, [reflections, searchQuery, dateFrom, dateTo, selectedTags]);

  const filterCount = [dateFrom, dateTo].filter(Boolean).length + selectedTags.length;
  const hasActiveFilters = filterCount > 0;

  const toggleTagFilter = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl text-[var(--teal)]">My Reflections</h1>
            <p className="mt-2 text-sm text-slate-600">Your spiritual journey, captured verse by verse.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--teal)] px-5 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring"
          >
            + New Reflection
          </Link>
        </div>

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch" ref={filterRef}>
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon className="h-5 w-5" />
            </span>
            <label htmlFor="dash-search" className="sr-only">
              Search reflections
            </label>
            <input
              id="dash-search"
              name="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="focus-ring h-12 w-full rounded-full border border-[var(--border)] bg-white py-3 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400"
              placeholder="Search by verse, keyword, or mood..."
            />
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              aria-expanded={filtersOpen}
              aria-controls="reflection-filters"
            >
              <SlidersIcon className="h-4 w-4 text-slate-600" />
              Filters
              {hasActiveFilters ? (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--peach-soft)] px-1.5 text-xs font-semibold text-[var(--peach)]">
                  {filterCount}
                </span>
              ) : null}
            </button>
            {filtersOpen ? (
              <div
                id="reflection-filters"
                className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-lg sm:left-auto"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="block text-xs text-slate-600">
                    From
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="focus-ring mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    To
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="focus-ring mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                    />
                  </label>
                </div>
                {allTags.length > 0 ? (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</p>
                    <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                      {allTags.map((tag) => (
                        <li key={tag}>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag)}
                              onChange={() => toggleTagFilter(tag)}
                              className="rounded border-slate-300 text-[var(--teal)] focus:ring-[var(--teal)]"
                            />
                            {tag}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-4 text-xs text-slate-500">Add tags when saving a reflection to filter by them.</p>
                )}
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 w-full rounded-full border border-[var(--border)] py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 && reflections.length > 0 ? (
          <section className="surface-card mt-8 p-10 text-center">
            <h2 className="text-2xl text-slate-800">No matches</h2>
            <p className="mt-2 text-sm text-slate-600">Try adjusting search or filters.</p>
          </section>
        ) : null}

        {reflections.length === 0 ? (
          <section className="surface-card mt-8 p-10 text-center">
            <h2 className="text-3xl text-slate-800">No reflections yet</h2>
            <p className="mt-3 text-sm text-slate-600">Start your first reflection and it will appear here.</p>
          </section>
        ) : filtered.length > 0 ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Saved reflections">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/${item.id}`}
                className="surface-card group block p-6 text-left transition hover:border-[var(--teal)] hover:shadow-md focus-visible:focus-ring"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="rounded-full bg-[var(--peach-soft)] px-3 py-1 text-xs font-semibold text-[var(--peach)]">
                    {item.emotion}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
                <h2 className="mt-4 text-2xl text-[var(--teal)] group-hover:underline">{item.title || "Untitled Reflection"}</h2>
                {(item.tags || []).length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Your tags">
                    {(item.tags || []).map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-[var(--border)] bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-700">{item.reflectionText}</p>
                {(item.ayahs || []).length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Verses in this reflection">
                    {(item.ayahs || []).map((ayah, idx) => {
                      const label = ayahCapsuleLabel(ayah);
                      if (!label) return null;
                      return (
                        <li
                          key={ayah.id ?? ayah.verseKey ?? idx}
                          className="rounded-full border border-[var(--teal)]/25 bg-[var(--teal-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--teal)]"
                        >
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
