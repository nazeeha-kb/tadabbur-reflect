"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AyahsLoadingSkeleton from "@/components/AyahsLoadingSkeleton";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import { persistHomeSearchQuery } from "@/lib/reflections/searchQuery";
import { getStoredReflections } from "@/lib/storage/reflections";
import { useUISettings } from "@/components/UISettingsProvider";
import { searchDebug } from "@/lib/search/searchDebug";
import { cacheVerseForReflection } from "@/lib/reflections/verseCache";

const PER_PAGE = 8;

export default function ReflectFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emotionQuery = useMemo(() => searchParams.get("q")?.trim() || "", [searchParams]);
  const queryTafseerSource = useMemo(() => searchParams.get("tafseer")?.trim() || "", [searchParams]);
  const page = useMemo(() => Math.max(1, Number(searchParams.get("page") || "1")), [searchParams]);
  const { tafseerSource, setTafseerSource } = useUISettings();

  const [, startTransition] = useTransition();
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reflectedKeys, setReflectedKeys] = useState(() => new Set());

  const pagedAyahs = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return ayahs.slice(start, start + PER_PAGE);
  }, [ayahs, page]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(ayahs.length / PER_PAGE)), [ayahs.length]);

  const updatePage = useCallback((nextPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.replace(`/reflect?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    if (queryTafseerSource && queryTafseerSource !== tafseerSource) {
      setTafseerSource(queryTafseerSource);
    }
  }, [queryTafseerSource, setTafseerSource, tafseerSource]);

  useEffect(() => {
    searchDebug("reflect.mount", {
      emotionQuery,
      tafseerSource,
    });

    if (!emotionQuery) {
      setError("Please go back and enter an emotion.");
      setLoading(false);
      return;
    }

    persistHomeSearchQuery(emotionQuery);

    let alive = true;
    async function loadAyahs() {
      try {
        setLoading(true);
        setError("");
        const endpoint = `/api/ayahs?q=${encodeURIComponent(emotionQuery)}`;
        searchDebug("reflect.fetch.start", { endpoint });
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json();
        searchDebug("reflect.fetch.response", {
          ok: response.ok,
          status: response.status,
          ayahCount: payload?.ayahs?.length ?? 0,
        });
        if (payload?.code === "UNAVAILABLE") {
          if (alive) {
            setAyahs([]);
            setError(payload?.message || "Search is temporarily unavailable. Please try again.");
          }
          return;
        }

        if (!response.ok) {
          const msg =
            payload?.message ||
            (payload?.code === "SDK_AUTH"
              ? "Quran Foundation authentication failed. Check QF_CLIENT_ID, QF_CLIENT_SECRET, and QF_ENV (prelive vs production)."
              : payload?.code === "NETWORK"
                ? "Check your connection and try again."
                : payload?.code === "EMPTY"
                  ? "No results found for this search."
                  : "Search request failed.");
          throw new Error(msg);
        }
        if (alive) {
          const nextAyahs = Array.isArray(payload.ayahs) ? payload.ayahs : [];
          setAyahs(nextAyahs);
          if (nextAyahs.length === 0) {
            setError(payload?.message || "No results found for this search.");
          }
          try {
            if (emotionQuery) {
              sessionStorage.setItem(`reflect-themes:${emotionQuery}`, JSON.stringify(payload.themes || []));
            }
          } catch {
            /* ignore */
          }
        }
      } catch (loadError) {
        if (alive) {
          const msg = loadError?.message || "";
          if (/failed to fetch|network/i.test(msg)) {
            setError("Check your connection and try again.");
          } else {
            setError(msg || "Search request failed.");
          }
        }
        searchDebug("reflect.fetch.error", { message: loadError?.message });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAyahs();
    return () => {
      alive = false;
    };
  }, [emotionQuery, tafseerSource]);

  useEffect(() => {
    const keys = new Set(
      getStoredReflections()
        .flatMap((item) => item.ayahs || [])
        .map((ayah) => ayah?.verseKey)
        .filter(Boolean),
    );
    setReflectedKeys(keys);
  }, []);

  useEffect(() => {
    if (page > pageCount) {
      updatePage(pageCount);
    }
  }, [page, pageCount, updatePage]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-15 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--peach)]">New Reflection:</p>
        <h1 className="mt-2 text-6xl text-[var(--teal)]">{emotionQuery || "Reflection"}</h1>
        <p className="mt-3 text-sm text-slate-600">Select an ayah to reflect on.</p>

        <section className="mt-8 space-y-6" aria-live="polite" aria-busy={loading}>
          {loading && <AyahsLoadingSkeleton count={3} />}
          {loading && (
            <p className="sr-only">Loading curated ayahs for your reflection. Please wait.</p>
          )}
          {!loading && error && <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>}

          {!loading && !error && ayahs.length === 0 ? (
            <p className="surface-card p-6 text-sm text-slate-600">
              No verses matched this search. Try different words or check the browser console with search debug enabled.
            </p>
          ) : null}

          {!loading &&
            !error &&
            pagedAyahs.map((ayah) => (
              <article
                key={ayah.id}
                role="link"
                tabIndex={0}
                onClick={() => {
                  cacheVerseForReflection(ayah);
                  const href = `/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}${
                    tafseerSource ? `&tafseer=${encodeURIComponent(tafseerSource)}` : ""
                  }`;
                  startTransition(() => router.push(href));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    cacheVerseForReflection(ayah);
                    const href = `/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}${
                      tafseerSource ? `&tafseer=${encodeURIComponent(tafseerSource)}` : ""
                    }`;
                    startTransition(() => router.push(href));
                  }
                }}
                className={`relative block cursor-pointer group rounded-[2rem] border p-6 sm:p-8 transition focus-visible:focus-ring ${
                  reflectedKeys.has(ayah.verseKey)
                    ? "border-[var(--teal)] bg-[var(--teal-soft)] shadow-[0_18px_60px_-32px_rgba(31,107,113,0.35)]"
                    : "surface-card"
                }`}
              >
                {/* Check reflected */}
                {reflectedKeys.has(ayah.verseKey) ? (
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[var(--teal)] shadow-sm ring-1 ring-[var(--teal)]/15">
                    Reflected
                  </span>
                ) : null}
                {/* Audio button */}
                <div className="absolute right-4 top-4">
                  <AyahAudioButton verseKey={ayah.verseKey} />
                </div>
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  {formatVerseCitation(ayah)}
                </p>
                {/* Ayah */}
                {ayah.arabicText ? (
                  <p
                    dir="rtl"
                    lang="ar"
                    className="mt-4 text-2xl leading-[1.9] text-[#0f4f5f]"
                  >
                    {ayah.arabicText}
                  </p>
                ) : null}
                {/* Translation */}
                {ayah.translation ? (
                  <p className="mt-4 leading-relaxed text-slate-600">{ayah.translation}</p>
                ) : null}
                {/* open this ayah */}
                <p className="mt-5 text-xs font-medium text-[var(--teal)] opacity-0 transition group-hover:opacity-60">
                  Open this ayah →
                </p>
              </article>
            ))}

            {/* Pagination */}
          {!loading && !error && ayahs.length > PER_PAGE ? (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-2" aria-label="Search result pages">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updatePage(page - 1)}
                className="cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => updatePage(n)}
                  className={`cursor-pointer h-9 min-w-9 rounded-full border px-3 text-sm ${
                    n === page
                      ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                      : "border-[var(--border)] bg-white text-slate-700"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => updatePage(page + 1)}
                className="cursor-pointer rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}
