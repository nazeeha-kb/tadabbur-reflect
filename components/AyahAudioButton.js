"use client";

import { useEffect, useRef, useState } from "react";

export default function AyahAudioButton({ verseKey, recitationId = 7 }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function prefetchAudio() {
      if (resolvedUrl) return;
      try {
        const res = await fetch(
          `/api/recite?verseKey=${encodeURIComponent(verseKey)}&recitationId=${encodeURIComponent(String(recitationId))}`,
          { cache: "no-store" },
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const url = payload?.audioUrl;
        if (typeof url !== "string" || !url.trim()) return;
        const resolved = { url, fallbackUrl: payload?.fallbackUrl };
        if (cancelled) return;
        setResolvedUrl(resolved);
        const audio = audioRef.current;
        if (audio && audio.src !== url) {
          audio.src = url;
          audio.preload = "metadata";
          audio.load();
        }
      } catch {
        /* ignore prefetch errors */
      }
    }

    prefetchAudio();
    return () => {
      cancelled = true;
    };
  }, [verseKey, recitationId, resolvedUrl]);

  async function ensureResolvedUrl() {
    if (resolvedUrl) return resolvedUrl;
    const res = await fetch(
      `/api/recite?verseKey=${encodeURIComponent(verseKey)}&recitationId=${encodeURIComponent(String(recitationId))}`,
      { cache: "no-store" },
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.message || "Unable to load recitation.");
    }
    const url = payload?.audioUrl;
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("No audio found for this ayah.");
    }
    const resolved = { url, fallbackUrl: payload?.fallbackUrl };
    setResolvedUrl(resolved);
    const audio = audioRef.current;
    if (audio && audio.src !== url) {
      audio.src = url;
      audio.preload = "metadata";
      audio.load();
    }
    return resolved;
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          (async () => {
            e.preventDefault();
            e.stopPropagation();
            const audio = audioRef.current;
            if (!audio || busy) return;
            if (playing) {
              audio.pause();
              setPlaying(false);
              return;
            }
            try {
              setBusy(true);
              const { url, fallbackUrl } = await ensureResolvedUrl();
              if (audio.src !== url) audio.src = url;
              try {
                await audio.play();
              } catch {
                if (fallbackUrl && typeof fallbackUrl === "string") {
                  audio.src = fallbackUrl;
                  await audio.play();
                } else {
                  throw new Error("play_failed");
                }
              }
              setPlaying(true);
            } catch {
              // silent fail; keep UI calm
              setPlaying(false);
            } finally {
              setBusy(false);
            }
          })();
        }}
        className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white/85 text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-60"
        aria-label={playing ? "Pause recitation" : "Play recitation"}
        title={playing ? "Pause" : "Play"}
        disabled={busy}
      >
        {playing ? (
          <span className="text-[11px] font-semibold leading-none">❚❚</span>
        ) : (
          <span className="ml-0.5 text-[11px] font-semibold leading-none">▶</span>
        )}
      </button>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </>
  );
}

