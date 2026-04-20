"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";
import TagInput from "@/components/TagInput";
import TafseerSourceSelect from "@/components/TafseerSourceSelect";
import RichReflectionEditor from "@/components/RichReflectionEditor";
import { useUISettings } from "@/components/UISettingsProvider";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import { saveReflection } from "@/lib/storage/reflections";
import { getTafseerSourceMeta } from "@/lib/tafseerSources";
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
  const sourceMeta = useMemo(() => getTafseerSourceMeta(tafseerSource), [tafseerSource]);

  useEffect(() => {
    if (queryTafseerSource && queryTafseerSource !== tafseerSource) {
      setTafseerSource(queryTafseerSource);
    }
  }, [queryTafseerSource, setTafseerSource, tafseerSource]);

  const [ayah, setAyah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
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

    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        if (emotionQuery) {
          const listRes = await fetch(
            `/api/ayahs?q=${encodeURIComponent(emotionQuery)}&tafseer=${encodeURIComponent(tafseerSource)}`,
            { cache: "no-store" },
          );
          const listPayload = await listRes.json();
          if (listRes.ok) {
            const found = (listPayload?.ayahs || []).find((a) => a?.verseKey === verseKey);
            if (found) {
              if (alive) setAyah(found);
              return;
            }
          }
        }

        const res = await fetch(
          `/api/ayah?verseKey=${encodeURIComponent(verseKey)}&tafseer=${encodeURIComponent(tafseerSource)}`,
          { cache: "no-store" },
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || "Unable to fetch verse.");
        if (alive) setAyah(payload.ayah || null);
      } catch (e) {
        if (alive) setError(e?.message || "Something went wrong.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [router, verseKey, emotionQuery, tafseerSource]);

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

    setSaving(true);
    try {
      const reflection = {
        id: crypto.randomUUID(),
        emotion: emotionQuery || "Selected ayah",
        userInput: emotionQuery || verseKey,
        ayahs: [ayah],
        reflectionText: reflectionText.trim(),
        title: title.trim(),
        tags,
        createdAt: new Date().toISOString(),
        verseKey,
      };
      saveReflection(reflection);
      toast.success("Reflection saved.");
      router.push("/reflections");
    } catch {
      toast.error("Could not save your reflection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-stone-50 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(212,141,98,0.09),transparent_55%),radial-gradient(ellipse_70%_45%_at_100%_30%,rgba(31,107,113,0.07),transparent_50%),radial-gradient(ellipse_55%_40%_at_0%_85%,rgba(31,107,113,0.05),transparent_50%)]"
      />
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
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

        <section className="mt-6 space-y-6" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <p className="surface-card p-6 text-sm text-slate-600">Loading selected ayah…</p>
          ) : error ? (
            <p className="surface-card border-rose-300 p-6 text-sm text-rose-700">{error}</p>
          ) : ayah ? (
            <article className="surface-card relative p-6 sm:p-8">
              <div className="absolute right-4 top-4">
                <AyahAudioButton verseKey={ayah.verseKey} />
              </div>
              <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                {formatVerseCitation(ayah)}
              </p>
              <p className="mt-5 text-right text-3xl leading-[1.85] text-[#0f4f5f] sm:text-[2rem]">
                {ayah.arabicText}
              </p>
              {ayah.translation ? (
                <p className="mt-6 text-xl leading-relaxed text-slate-800">{ayah.translation}</p>
              ) : null}
              {ayah.tafseer?.trim() ? (
                <div className="mt-5 rounded-xl border-l-4 border-[var(--teal)] bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Context and tafsir
                    </p>
                    <TafseerSourceSelect compact />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Current source: {sourceMeta.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{ayah.tafseer}</p>
                </div>
              ) : null}
            </article>
          ) : null}
        </section>


        {/* Reflection section */}
        <section className="paper-bg mt-12 rounded-3xl p-6 sm:p-8 border border-[#d2c8b9] bg-[#fdfbf7]">
          <div className="w-full flex justify-between">
            <h2 className="text-3xl text-slate-700 font-semibold">Edit reflection</h2>
          </div>
          <div className="mt-6 space-y-8">
            <label htmlFor="edit-title" className="text-xs tracking-wider font-medium text-slate-600 uppercase">
              Title (optional)
            </label>
            <input
              id="edit-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your reflection a title"
              className="w-full border-b-2 border-[var(--border)] py-3 text-xl "
            />
            <label htmlFor="edit-tags" className="text-xs tracking-wider font-medium text-slate-600 uppercase">
              Tags
            </label>
            <TagInput id="edit-tags" tags={tags} onChange={setTags} placeholder="Add tags, press Enter" />
            <label htmlFor="edit-reflection" className="text-xs tracking-wider font-medium text-slate-600 uppercase">
              Your reflection
            </label>
            {/* Reflection box */}
            <div>
              <RichReflectionEditor
                id="edit-reflection"
                value={reflectionText}
                onChange={setReflectionText}
                rows={8}
                placeholder="Begin your reflection here"
              />

            </div>
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
                disabled={!reflectionText.trim()}
                className="rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:focus-ring"
              >
                Save changes
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
