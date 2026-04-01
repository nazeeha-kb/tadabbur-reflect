"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import TagInput from "@/components/TagInput";
import { getReflectionById, updateReflection } from "@/lib/storage/reflections";

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
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (!id) {
      router.replace("/dashboard");
      return;
    }
    const r = getReflectionById(id);
    if (!r) {
      router.replace("/dashboard");
      return;
    }
    setTitle(r.title || "");
    setReflectionText(r.reflectionText || "");
    setTags(Array.isArray(r.tags) ? r.tags : []);
    setAyahs(Array.isArray(r.ayahs) ? r.ayahs : []);
    setEmotion(r.emotion || "");
    setCreatedAt(r.createdAt || "");
    setLoaded(true);
  }, [id, router]);

  const handleSave = () => {
    if (!reflectionText.trim()) return;
    const ok = updateReflection(id, {
      title: title.trim(),
      reflectionText: reflectionText.trim(),
      tags,
    });
    if (ok) router.push("/dashboard");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-600 sm:px-6">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/dashboard" className="font-medium text-[var(--teal)] hover:underline">
            ← My Reflections
          </Link>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--peach)]">Edit reflection</p>
        <p className="mt-2 text-sm text-slate-600">
          Reflection on:{" "}
          <span className="font-medium text-slate-800">&ldquo;{emotion || "—"}&rdquo;</span>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-[var(--teal)] sm:text-4xl">{title.trim() || "Untitled reflection"}</h1>
        {createdAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Saved{" "}
            {new Date(createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        ) : null}

        <section className="mt-8 space-y-6" aria-label="Verses">
          {ayahs.map((ayah) => (
            <article key={ayah.id ?? ayah.verseKey} className="surface-card p-6 sm:p-8">
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
              {ayah.tafseer?.trim() ? (
                <div className="mt-5 rounded-xl border-l-4 border-[var(--teal)] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context and tafsir</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{ayah.tafseer}</p>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl bg-white/60 p-6 sm:p-8">
          <h2 className="text-3xl text-slate-800">Edit reflection</h2>
          <div className="mt-6 space-y-4">
            <label htmlFor="edit-title" className="text-sm font-medium text-slate-700">
              Title (optional)
            </label>
            <input
              id="edit-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="A short title for this reflection"
            />
            <label htmlFor="edit-tags" className="text-sm font-medium text-slate-700">
              Tags
            </label>
            <TagInput id="edit-tags" tags={tags} onChange={setTags} placeholder="Add tags, press Enter" />
            <label htmlFor="edit-reflection" className="text-sm font-medium text-slate-700">
              Your reflection
            </label>
            <textarea
              id="edit-reflection"
              name="reflection"
              value={reflectionText}
              onChange={(event) => setReflectionText(event.target.value)}
              rows={8}
              className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="Your thoughts and notes."
            />
            <div className="flex justify-end gap-3">
              <Link
                href="/dashboard"
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
