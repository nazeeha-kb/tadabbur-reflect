"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AyahsLoadingSkeleton from "@/components/AyahsLoadingSkeleton";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import { getStoredReflections } from "@/lib/storage/reflections";
import { useUISettings } from "@/components/UISettingsProvider";

const PER_PAGE = 8;

export default function ReflectFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emotionQuery = useMemo(() => searchParams.get("q")?.trim() || "", [searchParams]);
  const queryTafseerSource = useMemo(() => searchParams.get("tafseer")?.trim() || "", [searchParams]);
  const page = useMemo(() => Math.max(1, Number(searchParams.get("page") || "1")), [searchParams]);
  const { tafseerSource, setTafseerSource } = useUISettings();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTafseerSource, setTafseerSource, tafseerSource]);

  useEffect(() => {
    if (!emotionQuery) {
      setError("Please go back and enter an emotion.");
      setLoading(false);
      return;
    }

    let alive = true;
    async function loadAyahs() {
      try {
        setLoading(true);
        setError("");
        const endpoint = `/api/ayahs?q=${encodeURIComponent(emotionQuery)}${
          tafseerSource ? `&tafseer=${encodeURIComponent(tafseerSource)}` : ""
        }`;
        const response = await fetch(endpoint);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Unable to fetch verses.");
        }
        if (alive) {
          setAyahs(payload.ayahs || []);
          try {
            if (emotionQuery) {
              sessionStorage.setItem(`reflect-themes:${emotionQuery}`, JSON.stringify(payload.themes || []));
            }
          } catch {
            /* ignore */
          }
        }
      } catch (loadError) {
        if (alive) setError(loadError?.message || "Something went wrong.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAyahs();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--peach)]">New Reflection</p>
        <h1 className="mt-2 text-6xl text-[var(--teal)]">{emotionQuery || "Reflection"}</h1>
        <p className="mt-3 text-sm text-slate-600">Select an ayah to reflect on.</p>

        <section className="mt-8 space-y-6" aria-live="polite" aria-busy={loading}>
          {loading && <AyahsLoadingSkeleton count={3} />}
          {loading && (
            <p className="sr-only">Loading curated ayahs for your reflection. Please wait.</p>
          )}
          {!loading && error && <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>}

          {!loading &&
            !error &&
            pagedAyahs.map((ayah) => (
              <article
                key={ayah.id}
                role="link"
                tabIndex={0}
                onClick={() =>
                  router.push(
                    `/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}${
                      tafseerSource ? `&tafseer=${encodeURIComponent(tafseerSource)}` : ""
                    }`,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(
                      `/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}${
                        tafseerSource ? `&tafseer=${encodeURIComponent(tafseerSource)}` : ""
                      }`,
                    );
                  }
                }}
                className={`relative block cursor-pointer rounded-[2rem] border p-6 sm:p-8 transition focus-visible:focus-ring ${
                  reflectedKeys.has(ayah.verseKey)
                    ? "border-[var(--teal)] bg-[var(--teal-soft)] shadow-[0_18px_60px_-32px_rgba(31,107,113,0.35)]"
                    : "surface-card"
                }`}
              >
                {reflectedKeys.has(ayah.verseKey) ? (
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[var(--teal)] shadow-sm ring-1 ring-[var(--teal)]/15">
                    Reflected
                  </span>
                ) : null}
                <div className="absolute right-4 top-4">
                  <AyahAudioButton verseKey={ayah.verseKey} />
                </div>
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  {formatVerseCitation(ayah)}
                </p>
                <p className="mt-5 text-right text-3xl leading-[1.85] text-[#0f4f5f] sm:text-[2rem]">
                  {ayah.arabicText}
                </p>
                <p className="mt-6 text-xl leading-relaxed text-slate-800 font-sans">{ayah.translation}</p>
                <p className="mt-5 text-xs font-medium text-[var(--teal)] opacity-0 transition group-hover:opacity-100">
                  Open this ayah →
                </p>
              </article>
            ))}
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
