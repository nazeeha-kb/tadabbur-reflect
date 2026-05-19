"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ConfirmModal from "@/components/ConfirmModal";
import MarkdownContent from "@/components/MarkdownContent";
import { SearchIcon, SlidersIcon } from "@/components/icons";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import {
  deleteReflection,
  dedupeReflections,
  getStoredReflections,
  retryFailedReflectionSyncs,
} from "@/lib/storage/reflections";
import {
  REFLECTION_STORAGE_EVENT,
  deriveDisplaySyncStatus,
  getServerReflectionId,
} from "@/lib/reflections/identity";
import { buildReflectionAuthHeaders, mapServerReflection } from "@/lib/reflections/mapServerReflection";
import { Trash2Icon } from "lucide-react";
const PAGE_SIZE = 10;
import SyncStatusBadge from "@/components/SyncStatusBadge";
// import SyncLegend from "@/components/SyncLegend";
import { toast } from "sonner";
import { BookOpenTextIcon } from "@phosphor-icons/react";
import ReflectionSearchLink from "@/components/ReflectionSearchLink";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ayahCapsuleLabel(ayah) {
  const cite = formatVerseCitation(ayah);
  if (cite) return cite;
  if (ayah?.verseKey) return String(ayah.verseKey);
  return "";
}

function LoadMoreButton({ loadingMore, onClick }) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loadingMore}
        className="focus-ring inline-flex h-11 min-w-[10rem] items-center justify-center rounded-full border border-[var(--border)] bg-white px-6 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        aria-busy={loadingMore}
      >
        {loadingMore ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}

function reflectionSearchBlob(item) {
  const ayahParts = (item.ayahs || []).flatMap((a) =>
    [a.translation, a.arabicText, a.surahName, String(a.ayahNumber ?? "")].filter(Boolean),
  );
  const tagStr = (item.tags || []).join(" ");
  return [item.emotion, item.title, item.reflectionText, tagStr, ...ayahParts].join(" ").toLowerCase();
}

function mergeSyncStatusFromLocal(serverList) {
  const local = getStoredReflections();
  const localByServerId = new Map();
  for (const row of local) {
    const sid = getServerReflectionId(row);
    if (sid) localByServerId.set(sid, row);
  }

  const serverRows = (Array.isArray(serverList) ? serverList : []).filter((row) => getServerReflectionId(row));
  const seenKeys = new Set();
  const merged = [];

  for (const row of serverRows) {
    const serverId = getServerReflectionId(row);
    if (!serverId) continue;
    const key = `id:${serverId}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const localRow = localByServerId.get(serverId);
    const combined = localRow
      ? {
        ...row,
        firebaseSyncStatus: localRow.firebaseSyncStatus ?? row.firebaseSyncStatus,
        qfSyncStatus: localRow.qfSyncStatus ?? row.qfSyncStatus,
      }
      : row;

    merged.push({
      ...combined,
      syncStatus: deriveDisplaySyncStatus(combined.firebaseSyncStatus, combined.qfSyncStatus),
    });
  }

  const pendingLocal = local.filter((r) => !getServerReflectionId(r));
  for (const row of pendingLocal) {
    const key = `fallback:${row.createdAt}|${row.verseKey}|${String(row.reflectionText || row.reflection || "").trim()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    merged.unshift(row);
  }

  return merged;
}

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState([]);
  const [useServerList, setUseServerList] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localVisibleCount, setLocalVisibleCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const filterRef = useRef(null);
  const useServerListRef = useRef(false);

  useEffect(() => {
    let alive = true;

    async function loadInitial() {
      setLoadingInitial(true);
      try {
        const headers = await buildReflectionAuthHeaders();
        const res = await fetch(`/api/reflections?limit=${PAGE_SIZE}`, {
          credentials: "include",
          headers,
        });

        if (res.ok) {
          const payload = await res.json();
          if (!alive) return;
          const mapped = (payload.reflections || []).map(mapServerReflection).filter(Boolean);
          setReflections(mergeSyncStatusFromLocal(mapped));
          setNextCursor(payload.nextCursor || null);
          setHasMore(Boolean(payload.hasMore));
          useServerListRef.current = true;
          setUseServerList(true);
          setLoadingInitial(false);
          return;
        }
      } catch {
        /* fall through to local */
      }

      if (!alive) return;
      useServerListRef.current = false;
      setUseServerList(false);
      const local = dedupeReflections(getStoredReflections());
      setReflections(local);
      setHasMore(local.length > PAGE_SIZE);
      setLoadingInitial(false);
    }

    void loadInitial();
    retryFailedReflectionSyncs();

    const id = setInterval(() => {
      setReflections((prev) => {
        if (useServerListRef.current) return mergeSyncStatusFromLocal(prev);
        return getStoredReflections();
      });
    }, 5000);

    const onStorage = () => {
      setReflections((prev) => {
        if (useServerListRef.current) return mergeSyncStatusFromLocal(prev);
        return getStoredReflections();
      });
    };
    window.addEventListener(REFLECTION_STORAGE_EVENT, onStorage);

    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener(REFLECTION_STORAGE_EVENT, onStorage);
    };
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

  const dedupedReflections = useMemo(() => dedupeReflections(reflections), [reflections]);

  const allTags = useMemo(() => {
    const s = new Set();
    dedupedReflections.forEach((r) => (r.tags || []).forEach((t) => s.add(t)));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [dedupedReflections]);

  const loadMore = async () => {
    if (useServerList) {
      if (!hasMore || !nextCursor || loadingMore) return;
      setLoadingMore(true);
      try {
        const headers = await buildReflectionAuthHeaders();
        const res = await fetch(
          `/api/reflections?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`,
          { credentials: "include", headers },
        );
        if (res.ok) {
          const payload = await res.json();
          const mapped = (payload.reflections || []).map(mapServerReflection).filter(Boolean);
          setReflections((prev) => mergeSyncStatusFromLocal([...prev, ...mapped]));
          setNextCursor(payload.nextCursor || null);
          setHasMore(Boolean(payload.hasMore));
        }
      } finally {
        setLoadingMore(false);
      }
      return;
    }

    setLocalVisibleCount((n) => n + PAGE_SIZE);
    setHasMore(localVisibleCount + PAGE_SIZE < reflections.length);
  };

  const filtered = useMemo(() => {
    let list = dedupedReflections;

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

    if (!useServerList) {
      list = list.slice(0, localVisibleCount);
    }

    return list;
  }, [reflections, searchQuery, dateFrom, dateTo, selectedTags, useServerList, localVisibleCount]);

  const showLoadMore = useServerList
    ? hasMore && !searchQuery && !dateFrom && !dateTo && selectedTags.length === 0
    : !searchQuery &&
    !dateFrom &&
    !dateTo &&
    selectedTags.length === 0 &&
    localVisibleCount < dedupedReflections.length;

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

  const confirmDeleteReflection = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const deleted = deleteReflection(id);
    if (!deleted) {
      toast.error("Could not delete this reflection.");
      return;
    }
    setReflections((prev) => prev.filter((r) => r.id !== id));
    toast.success("Reflection deleted.");
  };

  return (
    <div className="min-h-screen">
      <ConfirmModal
        open={pendingDeleteId != null}
        title="Delete this reflection?"
        description="This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteReflection}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl text-[var(--teal)]">My Reflections</h1>
            <p className="mt-2 text-sm text-slate-600">Your spiritual journey, captured verse by verse.</p>
            {/* <SyncLegend /> */}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--teal)] px-5 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:focus-ring"
            >
              + New Reflection
            </Link>
          </div>
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

        {loadingInitial ? (
          <section className="surface-card mt-8 p-10 text-center" aria-busy="true">
            <p className="text-sm text-slate-500">Loading reflections…</p>
          </section>
        ) : null}

        {!loadingInitial && reflections.length === 0 ? (
          <section className="surface-card mt-8 p-10 text-center">
            <h2 className="text-3xl text-slate-800">No reflections yet</h2>
            <p className="mt-3 text-sm text-slate-600">Start your first reflection and it will appear here.</p>
          </section>
        ) : !loadingInitial && filtered.length > 0 ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Saved reflections">
            {filtered.map((item) => (
              <article
                key={item.tempId || item.serverId || item.id}
                className="group rounded-3xl border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf8_100%)] p-6 text-left shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] transition hover:border-[var(--teal)]/40 hover:shadow-md flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <ReflectionSearchLink
                    reflection={item}
                    className="min-w-0 flex-1 rounded-lg focus-visible:focus-ring"
                  >
                    <p className="text-xs leading-snug text-[var(--peach)] hover:underline">
                      Back to results on:{" "}
                      <span className="font-medium text-slate-700 hover:text-[var(--teal)]">
                        &ldquo;{item.emotion || "—"}&rdquo;
                      </span>
                    </p>
                  </ReflectionSearchLink>
                  <div className="flex shrink-0 items-center gap-2">
                      <p className="text-xs font-medium text-slate-500">{formatDate(item.createdAt)}</p>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:focus-ring"
                        aria-label={`Delete reflection ${item.title || "untitled reflection"}`}
                        title="Delete reflection"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                  </div>
                </div>
                {(item.ayahs || []).length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Verses in this reflection">
                    {(item.ayahs || []).map((ayah, idx) => {
                      const label = ayahCapsuleLabel(ayah);
                      if (!label) return null;
                      // Ayah
                      return (
                        <li
                          key={ayah.id ?? ayah.verseKey ?? idx}
                          className="text-[var(--peach)] font-bold text-sm items-center flex gap-2"
                        >
                          <BookOpenTextIcon />
                          <span>{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <div className="mt-4 flex flex-1 flex-col gap-2">
                  {item.title ? (
                    <ReflectionSearchLink
                      reflection={item}
                      className="block w-full rounded-lg focus-visible:focus-ring"
                    >
                      <h2 className="text-2xl text-[var(--teal)] group-hover:underline">
                        {item.title || "Untitled Reflection"}
                      </h2>
                    </ReflectionSearchLink>
                  ) : null}
                  <Link
                    href={`/reflections/${getServerReflectionId(item) || item.id}`}
                    className="focus-visible:focus-ring flex flex-col flex-1 gap-2 justify-between"
                  >
                    <div className="line-clamp-4 overflow-hidden text-sm">
                      <MarkdownContent>{item.reflectionText || ""}</MarkdownContent>
                    </div>
                    <p className="pt-2 text-xs text-slate-500">
                      Edited on: {formatDate(item.updatedAt || item.createdAt)}
                    </p>
                    <div className="flex w-full justify-between items-end">
                      {(item.tags || []).length > 0 ? (
                        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Your tags">
                          {(item.tags || []).slice(0, 4).map((t) => (
                            <li
                              key={t}
                              className="rounded-full border border-[var(--border)] bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {/* <SyncStatusBadge status={item.syncStatus} /> */}
                    </div>

                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {showLoadMore ? (
          <LoadMoreButton loadingMore={loadingMore} onClick={loadMore} />
        ) : null}
      </main>
    </div>
  );
}
