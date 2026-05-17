import { surahNameFromChapterId } from "@/lib/quran/surahNames";

function stripHtml(input = "") {
  return String(input).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function stableNumericId(verseKey, fallbackIndex) {
  const key = verseKey || `i:${fallbackIndex}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || fallbackIndex;
}

/**
 * Map Search API hit (getText=1) → unified verse result. No Content API hydration.
 */
export function mapSearchHitToVerseResult(hit, index = 0) {
  const verseKey = String(hit?.verseKey ?? hit?.key ?? "").trim();
  const chapterId = verseKey.split(":")[0] ?? "";

  return {
    verseKey,
    arabicText: stripHtml(hit?.arabic ?? hit?.textUthmani ?? hit?.text_uthmani ?? ""),
    translation: stripHtml(hit?.name ?? hit?.translation ?? ""),
    id: stableNumericId(verseKey, index),
    surahName: surahNameFromChapterId(chapterId) || `Surah ${chapterId}`,
    ayahNumber: Number(verseKey.split(":")[1] ?? 0),
  };
}
