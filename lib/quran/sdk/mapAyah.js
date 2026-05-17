import { surahLabelForVerseKey } from "@/lib/quran/sdk/chapters";

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

function pickTranslation(translations, preferredResourceId) {
  if (!Array.isArray(translations) || translations.length === 0) return "";
  const english = translations.filter((t) => String(t.languageName || t.language_name || "").toLowerCase() === "english");
  const pool = english.length > 0 ? english : translations;
  const preferred = preferredResourceId
    ? pool.find((t) => Number(t.resourceId ?? t.resource_id) === preferredResourceId)
    : null;
  return stripHtml((preferred ?? pool[0])?.text ?? "");
}

export function mapVerseToAyah(verse, chapterNameMap, index = 0, translationResourceId) {
  const verseKey = String(verse?.verseKey ?? verse?.verse_key ?? "").trim();
  const chapterId = verseKey.split(":")[0] ?? "";

  return {
    id: verse?.id ?? stableNumericId(verseKey, index),
    verseKey,
    surahName: surahLabelForVerseKey(verseKey, chapterNameMap),
    ayahNumber: Number(verseKey.split(":")[1] ?? verse?.verseNumber ?? verse?.verse_number ?? 0),
    arabicText: stripHtml(verse?.textUthmani ?? verse?.text_uthmani ?? verse?.text ?? ""),
    translation:
      pickTranslation(verse?.translations, translationResourceId) || stripHtml(verse?.translation ?? ""),
    tafseer: "",
  };
}
