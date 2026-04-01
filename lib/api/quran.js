import { emotionToSearchQuery } from "@/lib/api/emotionSearch";
import {
  isQuranFoundationConfigured,
  quranFoundationApiFetch,
  quranFoundationFetch,
} from "@/lib/api/quranFoundationAuth";

const PUBLIC_QURAN_BASE = "https://api.quran.com/api/v4";

/** Sahih International (English) — prefer when present in search payload */
const TRANSLATION_RESOURCE_ID = 131;

let chapterNameMap = null;

async function contentFetch(pathAndQuery, init = {}) {
  if (isQuranFoundationConfigured()) {
    return quranFoundationFetch(pathAndQuery, init);
  }
  const url = `${PUBLIC_QURAN_BASE}${pathAndQuery.startsWith("/") ? "" : "/"}${pathAndQuery}`;
  return fetch(url, init);
}

function stripHtml(input = "") {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function getChapterNameMap() {
  if (chapterNameMap) return chapterNameMap;
  const response = await contentFetch("/chapters?language=en", { next: { revalidate: 86400 } });
  if (!response.ok) return {};
  const payload = await response.json();
  const chapters = Array.isArray(payload.chapters) ? payload.chapters : [];

  chapterNameMap = chapters.reduce((acc, chapter) => {
    acc[String(chapter.id)] = chapter.name_simple;
    return acc;
  }, {});

  return chapterNameMap;
}

function pickTranslation(translations) {
  if (!Array.isArray(translations) || translations.length === 0) {
    return "";
  }
  const english = translations.filter((item) => item.language_name?.toLowerCase() === "english");
  const pool = english.length > 0 ? english : translations;
  const preferred = pool.find((item) => item.resource_id === TRANSLATION_RESOURCE_ID);
  const text = (preferred ?? pool[0]).text;
  return stripHtml(text ?? "");
}

/** Legacy Quran.com v4 `/search` payload */
function mapLegacySearchResult(result, surahNameMap) {
  const verseKey = result.verse_key ?? "";
  const chapterId = verseKey.split(":")?.[0] ?? "";

  return {
    id: result.verse_id,
    verseKey,
    surahName: surahNameMap[chapterId] ?? `Surah ${chapterId}`,
    ayahNumber: Number(verseKey.split(":")?.[1] ?? 0),
    arabicText: result.text ?? "",
    translation: pickTranslation(result.translations),
    tafseer: "",
  };
}

function stableNumericId(verseKey, fallbackIndex) {
  const key = verseKey || `i:${fallbackIndex}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || fallbackIndex;
}

/** Quran Foundation Search API v1 — see https://api-docs.quran.foundation/docs/search_apis_versioned/search-controller-search/ */
function extractFoundationSearchHits(payload) {
  const bucket = payload?.result?.verses ?? payload?.verses;
  if (!Array.isArray(bucket)) {
    return [];
  }
  return bucket.filter((item) => {
    const k = item?.key != null ? String(item.key) : "";
    return k.includes(":") || item?.result_type === "ayah";
  });
}

function mapFoundationSearchHit(hit, surahNameMap, index) {
  const verseKey = hit?.key != null ? String(hit.key) : "";
  const chapterId = verseKey.split(":")?.[0] ?? "";
  const translation = stripHtml(hit?.name ?? "");
  const arabic = typeof hit?.arabic === "string" ? hit.arabic : "";

  return {
    id: hit?.verse_id ?? stableNumericId(verseKey, index),
    verseKey,
    surahName: surahNameMap[chapterId] ?? `Surah ${chapterId}`,
    ayahNumber: Number(verseKey.split(":")?.[1] ?? 0),
    arabicText: arabic,
    translation,
    tafseer: "",
  };
}

async function searchVersesPublic(searchTerms) {
  const encoded = encodeURIComponent(searchTerms);
  const searchUrl = `/search?q=${encoded}&size=5&page=1`;
  const searchResponse = await contentFetch(searchUrl, { cache: "no-store" });
  if (!searchResponse.ok) {
    throw new Error("Unable to search verses at the moment.");
  }
  const payload = await searchResponse.json();
  const results = Array.isArray(payload.search?.results) ? payload.search.results : [];
  if (results.length === 0) {
    throw new Error("No verses found for this query. Try another word or phrase.");
  }
  const surahNameMap = await getChapterNameMap();
  return results.map((result) => mapLegacySearchResult(result, surahNameMap));
}

async function searchVersesFoundation(searchTerms) {
  const params = new URLSearchParams({
    mode: "advanced",
    query: searchTerms,
    page: "1",
    size: "5",
    translation_ids: String(TRANSLATION_RESOURCE_ID),
    get_text: "1",
  });

  let searchResponse;
  try {
    searchResponse = await quranFoundationApiFetch(`/v1/search?${params.toString()}`, { cache: "no-store" });
  } catch {
    throw new Error("Unable to search verses at the moment.");
  }

  if (!searchResponse.ok) {
    throw new Error(
      "Unable to search verses at the moment. Confirm your client can request the `search` OAuth scope and try again.",
    );
  }

  let payload;
  try {
    payload = await searchResponse.json();
  } catch {
    throw new Error("Unable to search verses at the moment.");
  }

  const hits = extractFoundationSearchHits(payload);
  if (hits.length === 0) {
    throw new Error("No verses found for this query. Try another word or phrase.");
  }

  const surahNameMap = await getChapterNameMap();
  return hits.slice(0, 5).map((hit, index) => mapFoundationSearchHit(hit, surahNameMap, index));
}

export async function getAyahsByEmotion(rawQuery) {
  const query = rawQuery?.trim();
  if (!query) {
    throw new Error("Please enter an emotion or situation.");
  }

  const searchTerms = emotionToSearchQuery(query);

  if (isQuranFoundationConfigured()) {
    return searchVersesFoundation(searchTerms);
  }
  return searchVersesPublic(searchTerms);
}

export function getContentApiMode() {
  return isQuranFoundationConfigured() ? "quran_foundation" : "public";
}
