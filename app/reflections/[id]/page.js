"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import TagInput from "@/components/TagInput";
import AyahAudioButton from "@/components/AyahAudioButton";
import AyahTafseerBlock from "@/components/AyahTafseerBlock";
import TafseerVisibilityToggle from "@/components/TafseerVisibilityToggle";
import RichReflectionEditor from "@/components/RichReflectionEditor";
import { useUISettings } from "@/components/UISettingsProvider";
import { formatVerseCitation } from "@/lib/quran/surahNames";
import { getReflectionById, updateReflection } from "@/lib/storage/reflections";
import { toast } from "sonner";
import ReflectionSearchLink from "@/components/ReflectionSearchLink";

export default function ReflectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [tags, setTags] = useState([]);
  const [ayahs, setAyahs] = useState([]);
  const [emotion, setEmotion] = useState("");
  const [reflectionRecord, setReflectionRecord] = useState(null);
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const { tafseerSource, showTafseer } = useUISettings();
  const lastTafseerSync = useRef("");

  useEffect(() => {
    if (!id) {
      router.replace("/reflections");
      return;
    }
    const r = getReflectionById(id);
    if (!r) {
      router.replace("/reflections");
      return;
    }
    setTitle(r.title || "");
    setReflectionText(r.reflectionText || "");
    setTags(Array.isArray(r.tags) ? r.tags : []);
    setAyahs(Array.isArray(r.ayahs) ? r.ayahs : []);
    setEmotion(r.emotion || "");
    setReflectionRecord(r);
    setCreatedAt(r.createdAt || "");
    setUpdatedAt(r.updatedAt || "");
    setLoaded(true);
  }, [id, router]);

  useEffect(() => {
    if (!loaded || ayahs.length === 0 || !showTafseer) return;
    const syncKey = `${tafseerSource}:${ayahs.length}`;
    if (lastTafseerSync.current === syncKey) return;
    lastTafseerSync.current = syncKey;
    let cancelled = false;
    (async () => {
      const refreshed = await Promise.all(
        ayahs.map(async (item) => {
          if (!item?.verseKey) return item;
          try {
            const res = await fetch(
              `/api/ayah?verseKey=${encodeURIComponent(item.verseKey)}&tafseer=${encodeURIComponent(tafseerSource)}`,
              { cache: "no-store" },
            );
            const payload = await res.json();
            if (!res.ok || !payload?.ayah) return item;
            return { ...item, tafseer: payload.ayah.tafseer || item.tafseer || "" };
          } catch {
            return item;
          }
        }),
      );
      if (!cancelled) {
        setAyahs(refreshed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ayahs, loaded, tafseerSource, showTafseer]);

  const handleSave = () => {
    if (!reflectionText.trim()) return;
    const ok = updateReflection(id, {
      title: title.trim(),
      reflectionText: reflectionText.trim(),
      tags,
    });
    if (!ok) {
      toast.error("Could not save changes.");
      return;
    }
    setUpdatedAt(new Date().toISOString());
    toast.success("Reflection saved.");
    router.push("/reflections");
  };

  if (!loaded) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/reflections" className="font-medium text-[var(--teal)] hover:underline">
            ← My Reflections
          </Link>
          <TafseerVisibilityToggle compact />
        </div>
      
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Edit reflection</p>
        <ReflectionSearchLink reflection={reflectionRecord} className="mt-2 block w-full rounded-lg focus-visible:focus-ring">
          <p className="text-sm text-slate-600">
          Reflection on:{" "}
          <span className="font-medium text-slate-800">&ldquo;{emotion || "—"}&rdquo;</span>
        </p>
        </ReflectionSearchLink>
        <ReflectionSearchLink
          reflection={reflectionRecord}
          className="mt-3 block w-full rounded-lg focus-visible:focus-ring"
        >
          <h1 className="font-serif text-3xl text-[var(--teal)] hover:underline sm:text-4xl">
            {title.trim() || "Untitled reflection"}
          </h1>
        </ReflectionSearchLink>

        <section className="mt-8 space-y-6" aria-label="Verses">
          {ayahs.map((ayah) => (
            <article key={ayah.id ?? ayah.verseKey} className="surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  {formatVerseCitation(ayah)}
                </p>
                <AyahAudioButton verseKey={ayah.verseKey} />
              </div>
              <p className="mt-5 text-right text-3xl leading-[1.85] text-[#0f4f5f] sm:text-[2rem]">
                {ayah.arabicText}
              </p>
              <p className="mt-6 text-xl leading-relaxed text-slate-800">{ayah.translation}</p>
              <AyahTafseerBlock tafseer={ayah.tafseer} className="mt-5" />
            </article>
          ))}
        </section>

        {/* Reflection section */}
        <section className="paper-bg mt-12 rounded-3xl p-6 sm:p-8 border border-[#d2c8b9] bg-[#fdfbf7]">
          <div className="w-full flex justify-between">
            <h2 className="text-3xl text-slate-700 font-semibold">Edit reflection</h2>
            <div>
              {createdAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Saved{" "}
                  {new Date(createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                </p>
              ) : null}
              {updatedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Updated at{" "}
                  {new Date(updatedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : null}

            </div>
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
                createdAt={createdAt}
                updatedAt={updatedAt}
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
