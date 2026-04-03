"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AyahAudioButton from "@/components/AyahAudioButton";
import SiteHeader from "@/components/SiteHeader";
import TagInput from "@/components/TagInput";
import { formatVerseCitation } from "@/lib/quran/surahNames";
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
          const listRes = await fetch(`/api/ayahs?q=${encodeURIComponent(emotionQuery)}`, { cache: "no-store" });
          const listPayload = await listRes.json();
          if (listRes.ok) {
            const found = (listPayload?.ayahs || []).find((a) => a?.verseKey === verseKey);
            if (found) {
              if (alive) setAyah(found);
              return;
            }
          }
        }

        const res = await fetch(`/api/ayah?verseKey=${encodeURIComponent(verseKey)}`, { cache: "no-store" });
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
  }, [router, verseKey, emotionQuery]);

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
            href={emotionQuery ? `/reflect?q=${encodeURIComponent(emotionQuery)}` : "/"}
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
              <p
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic), serif" }}
                className="mt-5 text-right text-3xl leading-[1.85] text-[#0f4f5f] sm:text-[2rem]"
              >
                {ayah.arabicText}
              </p>
              {ayah.translation ? (
                <p className="mt-6 text-xl leading-relaxed text-slate-800">{ayah.translation}</p>
              ) : null}
              {ayah.tafseer?.trim() ? (
                <div className="mt-5 rounded-xl border-l-4 border-[var(--teal)] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context and tafsir</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{ayah.tafseer}</p>
                </div>
              ) : null}
            </article>
          ) : null}
        </section>

        <section className="mt-10 rounded-3xl bg-white/60 p-6 sm:p-8">
          <h2 className="text-3xl text-slate-800">Reflect</h2>
          <div className="mt-6 space-y-4">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title (optional)
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="A short title for this reflection"
            />
            <label htmlFor="tags" className="text-sm font-medium text-slate-700">
              Tags (optional)
            </label>
            <TagInput id="tags" tags={tags} onChange={setTags} placeholder="e.g. gratitude, patience — press Enter" />
            <label htmlFor="reflection" className="text-sm font-medium text-slate-700">
              Your reflection
            </label>
            <p className="text-xs text-slate-500">
              Markdown supported: **bold**, *italic*, lists, and &gt; quotes.
            </p>
            <textarea
              id="reflection"
              name="reflection"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={10}
              className="focus-ring reflection-writing w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3"
              placeholder="Write your thoughts, what touched your heart, and what action you want to take."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={!reflectionText.trim() || !ayah || saving}
                className="rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:focus-ring"
              >
                {saving ? "Saving…" : "Save Reflection"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
