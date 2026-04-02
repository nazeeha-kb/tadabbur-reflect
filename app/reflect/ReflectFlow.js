"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AyahsLoadingSkeleton from "@/components/AyahsLoadingSkeleton";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";

export default function ReflectFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emotionQuery = useMemo(() => searchParams.get("q")?.trim() || "", [searchParams]);

  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const response = await fetch(`/api/ayahs?q=${encodeURIComponent(emotionQuery)}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Unable to fetch verses.");
        }
        if (alive) setAyahs(payload.ayahs || []);
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
  }, [emotionQuery]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--peach)]">New Reflection</p>
        <h1 className="mt-2 text-6xl text-[var(--teal)]">{emotionQuery || "Reflection"}</h1>

        <section className="mt-8 space-y-6" aria-live="polite" aria-busy={loading}>
          {loading && <AyahsLoadingSkeleton count={3} />}
          {loading && (
            <p className="sr-only">Loading curated ayahs for your reflection. Please wait.</p>
          )}
          {!loading && error && <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>}

          {!loading &&
            !error &&
            ayahs.map((ayah) => (
              <article
                key={ayah.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/reflect/${encodeURIComponent(ayah.verseKey)}?q=${encodeURIComponent(emotionQuery)}`);
                  }
                }}
                className="surface-card group relative block cursor-pointer p-6 sm:p-8 focus-visible:focus-ring"
              >
                <div className="absolute right-4 top-4">
                  <AyahAudioButton verseKey={ayah.verseKey} />
                </div>
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  Surah {ayah.surahName} · {ayah.ayahNumber}
                </p>
                <p
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic), serif" }}
                  className="mt-5 text-right text-3xl leading-[1.85] text-[#0f4f5f] sm:text-[2rem]"
                >
                  {ayah.arabicText}
                </p>
                <p className="mt-6 text-xl leading-relaxed text-slate-800">{ayah.translation}</p>
                <p className="mt-5 text-sm text-slate-600">
                  Select this ayah to see its context and tafsir, and write your reflection.
                </p>
                <p className="mt-5 text-xs font-medium text-[var(--teal)] opacity-0 transition group-hover:opacity-100">
                  Open this ayah →
                </p>
              </article>
            ))}
        </section>
      </main>
    </div>
  );
}
