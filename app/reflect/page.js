"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { saveReflection } from "@/lib/storage/reflections";

export default function ReflectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emotionQuery = useMemo(() => searchParams.get("q")?.trim() || "", [searchParams]);

  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [title, setTitle] = useState("");

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

  const handleSave = () => {
    if (!reflectionText.trim() || ayahs.length === 0) return;

    const reflection = {
      id: crypto.randomUUID(),
      emotion: emotionQuery,
      userInput: emotionQuery,
      ayahs,
      reflectionText: reflectionText.trim(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
    };

    saveReflection(reflection);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--peach)]">New Reflection</p>
        <h1 className="mt-2 text-6xl text-[var(--teal)]">{emotionQuery || "Reflection"}</h1>

        <section className="mt-8 space-y-6" aria-live="polite">
          {loading && <p className="surface-card p-6 text-sm text-slate-600">Loading curated ayahs...</p>}
          {!loading && error && <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>}

          {!loading &&
            !error &&
            ayahs.map((ayah) => (
              <article key={ayah.id} className="surface-card p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  Surah {ayah.surahName} · {ayah.ayahNumber}
                </p>
                <p
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic), serif" }}
                  className="mt-5 text-right text-4xl text-[#0f4f5f] sm:text-5xl"
                >
                  {ayah.arabicText}
                </p>
                <p className="mt-6 text-xl leading-relaxed text-slate-800">{ayah.translation}</p>
                {ayah.tafseer?.trim() ? (
                  <p className="mt-5 rounded-xl border-l-4 border-[var(--teal)] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {ayah.tafseer}
                  </p>
                ) : (
                  <p className="mt-5 rounded-xl border-l-4 border-slate-200 bg-slate-50/80 px-4 py-3 text-sm italic text-slate-600">
                    Sit with this verse: notice the words that stand out, and ask what Allah might be addressing in your
                    heart today.
                  </p>
                )}
              </article>
            ))}
        </section>

        <section className="mt-12 rounded-3xl bg-white/60 p-6 sm:p-8">
          <h2 className="text-4xl text-slate-800">Reflect on these verses</h2>
          <div className="mt-6 space-y-4">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="A short title for this reflection"
            />
            <label htmlFor="reflection" className="text-sm font-medium text-slate-700">
              Your reflection
            </label>
            <textarea
              id="reflection"
              name="reflection"
              value={reflectionText}
              onChange={(event) => setReflectionText(event.target.value)}
              rows={8}
              className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="Write your thoughts, what touched your heart, and what action you want to take."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !!error || !reflectionText.trim()}
                className="rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:focus-ring"
              >
                Complete Reflection
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
