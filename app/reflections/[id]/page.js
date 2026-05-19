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
import { REFLECTION_STORAGE_EVENT, getServerReflectionId } from "@/lib/reflections/identity";
import { getReflectionById, updateReflection } from "@/lib/storage/reflections";
import SyncStatusBadge from "@/components/SyncStatusBadge";
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
    function onIdentityReplaced(event) {
      const { tempId, serverId } = event.detail || {};
      if (tempId && serverId && id === tempId) {
        router.replace(`/reflections/${serverId}`);
      }
    }
    window.addEventListener(REFLECTION_STORAGE_EVENT, onIdentityReplaced);
    return () => window.removeEventListener(REFLECTION_STORAGE_EVENT, onIdentityReplaced);
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
    const recordId = getServerReflectionId(reflectionRecord) || id;
    const ok = updateReflection(recordId, {
      title: title.trim(),
      reflectionText: reflectionText.trim(),
      tags,
    });
    if (!ok) {
      toast.error("Could not save changes.");
      return;
    }
    setUpdatedAt(new Date().toISOString());
    setReflectionRecord((r) => ({ ...(r || {}), syncStatus: "syncing", title: title.trim(), reflectionText: reflectionText.trim(), tags }));
    toast.success("Reflection saved.");
    router.push("/reflections");
  };

        // poll for updates so syncStatus changes are reflected in UI
        useEffect(() => {
          if (!id) return;
        
          const iv = setInterval(() => {
            const r = getReflectionById(id);
            if (r) setReflectionRecord(r);
          }, 3000);
        
          return () => clearInterval(iv);
        }, [id]);
        

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
        </div>
      
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Edit reflection</p>
        <ReflectionSearchLink reflection={reflectionRecord} className="mt-2 block w-full rounded-lg focus-visible:focus-ring py-2">
          <p className="text-sm text-slate-600 hover:underline">
          Back to results on:{" "}
          <span className="font-medium text-slate-800">&ldquo;{emotion || "—"}&rdquo;</span>
        </p>
        </ReflectionSearchLink>
       
          <h1 className="font-serif text-3xl text-[var(--teal)] sm:text-4xl">
            {title.trim() || "Untitled reflection"}
          </h1>

        <section className="mt-8 space-y-6" aria-label="Verses">
          {ayahs.map((ayah) => (
            <article key={ayah.id ?? ayah.verseKey} className="surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold tracking-wide uppercase text-[var(--peach)]">
                  {formatVerseCitation(ayah)}
                </p>
                <AyahAudioButton verseKey={ayah.verseKey} />
              </div>
              {/* Ayah */}
              <p
                  dir="rtl"
                  lang="ar"
                  className="mt-6 text-center md:text-3xl text-2xl leading-[1.9] text-[#0f4f5f]"
                >
              {ayah.arabicText}
              </p>
              {/* Translation */}
              <p className="mt-4 text-center leading-relaxed text-slate-600 border bg-slate-100 border-slate-200 rounded-xl p-4">
              {ayah.translation}</p>
              {/* Tafseer */}
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
      {new Date(createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
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

  {reflectionRecord?.syncStatus ? (
    <div className="mt-2">
      <SyncStatusBadge status={reflectionRecord.syncStatus} />
    </div>
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
