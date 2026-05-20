"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";
import TagInput from "@/components/TagInput";
import AyahTafseerBlock from "@/components/AyahTafseerBlock";
import AyahsLoadingSkeleton from "@/components/AyahsLoadingSkeleton";
import RichReflectionEditor from "@/components/RichReflectionEditor";
import { useUISettings } from "@/components/UISettingsProvider";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import { getCachedVerse } from "@/lib/reflections/verseCache";
import { saveReflection } from "@/lib/storage/reflections";
import { toast } from "sonner";

export default function ReflectAyahPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const verseKey = useMemo(() => {
    const raw = params?.verseKey;
    if (typeof raw !== "string") return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params]);

  const emotionQuery = useMemo(() => searchParams.get("q")?.trim() || "", [searchParams]);
  const queryTafseerSource = useMemo(() => searchParams.get("tafseer")?.trim() || "", [searchParams]);
  const { tafseerSource, setTafseerSource } = useUISettings();
  useEffect(() => {
    if (queryTafseerSource && queryTafseerSource !== tafseerSource) {
      setTafseerSource(queryTafseerSource);
    }
  }, [queryTafseerSource, setTafseerSource, tafseerSource]);

  const [ayah, setAyah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [error, setError] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const createInFlight = useRef(false);
  const [, startTransition] = useTransition();
  const didPrefillTags = useRef(false);

  useEffect(() => {
    didPrefillTags.current = false;
    setTags([]);
  }, [verseKey]);

  useEffect(() => {
    if (!verseKey) {
      router.replace("/reflect");
      return;
    }

    const cached = getCachedVerse(verseKey);
    if (cached?.verseKey === verseKey) {
      setAyah(cached);
      setLoading(false);
    }

    let alive = true;
    async function loadVerseText() {
      try {
        if (!cached) setLoading(true);
        setError("");

        const params = new URLSearchParams({ verseKey });
        if (cached?.arabicText) params.set("arabicText", cached.arabicText);
        if (cached?.translation) params.set("translation", cached.translation);
        if (cached?.surahName) params.set("surahName", cached.surahName);

        const res = await fetch(`/api/ayah?${params.toString()}`, { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok && !cached) {
          throw new Error(payload?.message || "Failed to load verse.");
        }
        if (alive && payload?.ayah) {
          setAyah((prev) => ({
            ...(prev || {}),
            ...payload.ayah,
            arabicText: payload.ayah.arabicText || prev?.arabicText || "",
            translation: payload.ayah.translation || prev?.translation || "",
            tafseer:
              prev?.tafseer ?? prev?.tafsir ?? payload.ayah.tafseer ?? payload.ayah.tafsir ?? null,
          }));
        }
      } catch (e) {
        if (alive && !cached) {
          const msg = e?.message || "";
          setError(
            /failed to fetch|network/i.test(msg) ? "Check your connection and try again." : msg || "Failed to load verse.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadVerseText();
    return () => {
      alive = false;
    };
  }, [router, verseKey]);

  useEffect(() => {
    if (!verseKey || !tafseerSource) return;
    const hasText = ayah?.arabicText || ayah?.translation;
    if (!hasText && loading) return;

    let alive = true;
    async function loadTafseer() {
      setTafseerLoading(true);
      try {
        const params = new URLSearchParams({
          verseKey,
          tafseer: tafseerSource,
        });
        if (ayah?.arabicText) params.set("arabicText", ayah.arabicText);
        if (ayah?.translation) params.set("translation", ayah.translation);
        if (ayah?.surahName) params.set("surahName", ayah.surahName);

        const res = await fetch(`/api/ayah?${params.toString()}`, { cache: "no-store" });
        const payload = await res.json();
        if (alive && payload?.ayah) {
          setAyah((prev) => ({
            ...(prev || {}),
            tafseer:
              payload.ayah.tafseer ?? payload.ayah.tafsir ?? prev?.tafseer ?? prev?.tafsir ?? null,
          }));
        }
      } catch {
        /* tafseer optional */
      } finally {
        if (alive) setTafseerLoading(false);
      }
    }

    loadTafseer();
    return () => {
      alive = false;
    };
  }, [verseKey, tafseerSource, ayah?.arabicText, ayah?.translation, ayah?.surahName, loading]);

  useEffect(() => {
    if (!ayah || didPrefillTags.current) return;

    let themes = [];
    try {
      if (emotionQuery) {
        themes = JSON.parse(sessionStorage.getItem(`reflect-themes:${emotionQuery}`) || "[]");
      }
    } catch {
      themes = [];
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reflection-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery: emotionQuery,
            ayahTranslation: ayah.translation || "",
            reflectionText: "",
            themes,
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.tags) && data.tags.length > 0) {
          setTags(data.tags);
        }
      } catch {
        /* optional */
      } finally {
        if (!cancelled) didPrefillTags.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ayah, emotionQuery]);

  const handleSave = async () => {
    if (!ayah || !reflectionText.trim()) return;
    if (createInFlight.current) return;
    createInFlight.current = true;

    setSaving(true);
    try {
      const reflection = {
        tempId: crypto.randomUUID(),
        searchQuery: emotionQuery || "",
        emotion: emotionQuery || "Selected ayah",
        userInput: emotionQuery || verseKey,
        tafseerSource,
        ayahs: [ayah],
        reflectionText: reflectionText.trim(),
        title: title.trim(),
        tags,
        createdAt: new Date().toISOString(),
        verseKey,
      };
      saveReflection(reflection);
      toast.success("Reflection saved.");
      startTransition(() => router.push("/reflections"));
    } catch {
      toast.error("Could not save your reflection.");
    } finally {
      setSaving(false);
      createInFlight.current = false;
    }
  };

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-stone-50" />
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={
              emotionQuery
                ? `/reflect?q=${encodeURIComponent(emotionQuery)}&tafseer=${encodeURIComponent(tafseerSource)}`
                : "/"
            }
            className="text-sm font-medium text-[var(--teal)] hover:underline"
          >
            ← Back
          </Link>
        </div>

        <section className="mt-6 space-y-6" aria-live="polite" aria-busy={loading && !ayah}>
          {loading && !ayah ? (
            <AyahsLoadingSkeleton count={1} />
          ) : error ? (
            <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>
          ) : ayah ? (
            <article className="surface-card relative p-6 sm:p-10">
              <div className="absolute right-4 top-4">
                <AyahAudioButton verseKey={ayah.verseKey} />
              </div>
              <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                {formatVerseCitation(ayah)}
              </p>
              {ayah.arabicText ? (
                <p
                  dir="rtl"
                  lang="ar"
                  className="mt-6 text-center sm:text-3xl text-2xl leading-[1.9] text-[#0f4f5f]"
                >
                  {ayah.arabicText}
                </p>
              ) : null}
              {ayah.translation ? (
              <p className="mt-4 text-center leading-relaxed text-slate-600 border bg-slate-100 border-slate-200 rounded-xl p-4">
                  {ayah.translation}
                </p>
              ) : null}
              <AyahTafseerBlock
                tafseer={tafseerLoading && !ayah.tafseer ? "" : ayah.tafseer}
                className="mt-8"
              />
            </article>
          ) : null}
        </section>

        <section className="paper-bg mt-12 rounded-3xl border border-[#d2c8b9] bg-[#fdfbf7] p-6 sm:p-8">
          <h2 className="text-3xl font-semibold text-slate-700">Edit reflection</h2>
          <div className="mt-6 space-y-8">
            <label htmlFor="edit-title" className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Title (optional)
            </label>
            <input
              id="edit-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your reflection a title"
              className="w-full border-b-2 border-[var(--border)] py-3 text-xl"
            />
            <label htmlFor="edit-tags" className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Tags
            </label>
            <TagInput id="edit-tags" tags={tags} onChange={setTags} placeholder="Add tags, press Enter" />
            <label htmlFor="edit-reflection" className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Your reflection
            </label>
            <RichReflectionEditor
              id="edit-reflection"
              value={reflectionText}
              onChange={setReflectionText}
              rows={8}
              placeholder="Begin your reflection here"
            />
            <div className="flex justify-end gap-3">
              <Link
                href="/reflections"
                className="inline-flex items-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={!reflectionText.trim() || saving}
                className="rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:focus-ring"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}