import { interpretSearchThemes } from "@/lib/api/openrouterThemes";
import { surahNameFromChapterId } from "@/lib/quran/surahNames";
import { formatOAuthDebugHint, isQuranFoundationApiDebugEnabled } from "@/lib/api/qfApiDebug";
import {
  getQuranFoundationAccessToken,
  isPublicSearchFallbackActive,
  isQuranFoundationConfigured,
  quranFoundationApiFetch,
  quranFoundationFetch,
} from "@/lib/api/quranFoundationAuth";
import { DEFAULT_TAFSEER_SOURCE, getTafseerSourceMeta } from "@/lib/tafseerSources";

const PUBLIC_QURAN_BASE = "https://api.quran.com/api/v4";

/** Sahih International (English) — prefer when present in search payload */
const TRANSLATION_RESOURCE_ID = 131;

const MAX_MERGED_RESULTS = 40;
const SEARCH_PAGE_SIZE = 10;

let chapterNameMap = null;

async function contentFetch(pathAndQuery, init = {}) {
  if (isQuranFoundationConfigured()) {
    return quranFoundationFetch(pathAndQuery, init);
  }
  const url = `${PUBLIC_QURAN_BASE}${pathAndQuery.startsWith("/") ? "" : "/"}${pathAndQuery}`;
  return fetch(url, init);
}

/** Always hits public api.quran.com — use for keyword search when Foundation has no `search` scope. */
async function publicOnlyFetch(pathAndQuery, init = {}) {
  const url = `${PUBLIC_QURAN_BASE}${pathAndQuery.startsWith("/") ? "" : "/"}${pathAndQuery}`;
  return fetch(url, init);
}

function stripHtml(input = "") {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchTafsirTextForVerse(verseKey, sourceId = DEFAULT_TAFSEER_SOURCE) {
  if (!verseKey || !String(verseKey).includes(":")) return "";
  const sourceMeta = getTafseerSourceMeta(sourceId);
  const encoded = encodeURIComponent(verseKey);
  const res = await publicOnlyFetch(`/tafsirs/${sourceMeta.resourceId}/by_ayah/${encoded}`, {
    next: { revalidate: 86_400 },
  });
  if (!res.ok) return "";
  let data;
  try {
    data = await res.json();
  } catch {
    return "";
  }
  const raw = data?.tafsir?.text;
  if (typeof raw !== "string") return "";
  const cleaned = stripHtml(raw).trim();
  if (cleaned) return cleaned;
  return "";
}

async function enrichAyahsWithTafsir(ayahs, sourceId) {
  if (!Array.isArray(ayahs) || ayahs.length === 0) return ayahs;
  const texts = await Promise.all(ayahs.map((a) => fetchTafsirTextForVerse(a.verseKey, sourceId)));
  return ayahs.map((ayah, i) => ({
    ...ayah,
    tafseer: texts[i] || ayah.tafseer || "",
  }));
}

async function enrichAyahWithTafsir(ayah, sourceId) {
  if (!ayah || typeof ayah !== "object") return ayah;
  if (ayah.tafseer?.trim()) return ayah;
  const tafseer = await fetchTafsirTextForVerse(ayah.verseKey, sourceId);
  return { ...ayah, tafseer: tafseer || "" };
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
    surahName: surahNameMap[chapterId] ?? (surahNameFromChapterId(chapterId) || `Surah ${chapterId}`),
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
    surahName: surahNameMap[chapterId] ?? (surahNameFromChapterId(chapterId) || `Surah ${chapterId}`),
    ayahNumber: Number(verseKey.split(":")?.[1] ?? 0),
    arabicText: arabic,
    translation,
    tafseer: "",
  };
}

async function searchVersesPublic(searchTerms, page = 1, size = SEARCH_PAGE_SIZE) {
  const encoded = encodeURIComponent(searchTerms);
  const searchUrl = `/search?q=${encoded}&size=${size}&page=${page}`;
  const searchResponse = await publicOnlyFetch(searchUrl, { cache: "no-store" });
  if (!searchResponse.ok) {
    const text = await searchResponse.text();
    throw new Error(`Unable to search verses at the moment.${formatOAuthDebugHint(searchResponse.status, text)}`);
  }
  const payload = await searchResponse.json();
  const results = Array.isArray(payload.search?.results) ? payload.search.results : [];
  if (results.length === 0) {
    throw new Error("No verses found for this query. Try another word or phrase.");
  }
  const surahNameMap = await getChapterNameMap();
  return results.map((result) => mapLegacySearchResult(result, surahNameMap));
}

async function searchVersesFoundation(searchTerms, page = 1, size = SEARCH_PAGE_SIZE) {
  const params = new URLSearchParams({
    mode: "advanced",
    query: searchTerms,
    page: String(page),
    size: String(size),
    translation_ids: String(TRANSLATION_RESOURCE_ID),
    get_text: "1",
  });

  let searchResponse;
  try {
    searchResponse = await quranFoundationApiFetch(`/v1/search?${params.toString()}`, { cache: "no-store" });
  } catch (err) {
    const base = "Unable to search verses at the moment.";
    if (err instanceof Error && err.message) {
      if (isQuranFoundationApiDebugEnabled()) {
        throw new Error(`${base} ${err.message}`);
      }
    }
    throw new Error(base);
  }

  if (!searchResponse.ok) {
    const text = await searchResponse.text();
    throw new Error(
      `Unable to search verses at the moment.${formatOAuthDebugHint(searchResponse.status, text)}`,
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
    const hint =
      isQuranFoundationApiDebugEnabled() && payload && typeof payload === "object"
        ? " [debug: search returned 0 verse hits; check response shape / scopes]"
        : "";
    throw new Error(`No verses found for this query. Try another word or phrase.${hint}`);
  }

  const surahNameMap = await getChapterNameMap();
  return hits.slice(0, size).map((hit, index) => mapFoundationSearchHit(hit, surahNameMap, index));
}

async function searchVersesPublicOrEmpty(searchTerms, page, size) {
  try {
    return await searchVersesPublic(searchTerms, page, size);
  } catch {
    return [];
  }
}

async function searchVersesFoundationOrEmpty(searchTerms, page, size) {
  try {
    return await searchVersesFoundation(searchTerms, page, size);
  } catch {
    return [];
  }
}

/**
 * Run several intent-derived queries and merge unique verses (semantic / NL-friendly).
 */
async function searchVersesMerged(queries, maxResults = MAX_MERGED_RESULTS) {
  const list = Array.isArray(queries) ? queries.map((q) => String(q).trim()).filter(Boolean) : [];
  if (list.length === 0) {
    throw new Error("No verses found for this query. Try another word or phrase.");
  }

  const seen = new Set();
  const merged = [];

  const pushBatch = (batch) => {
    if (!Array.isArray(batch)) return;
    for (const a of batch) {
      const key = a?.verseKey;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(a);
      if (merged.length >= maxResults) return true;
    }
    return false;
  };

  if (isQuranFoundationConfigured()) {
    await getQuranFoundationAccessToken();
    const usePublic = isPublicSearchFallbackActive();
    for (const q of list) {
      if (merged.length >= maxResults) break;
      for (let page = 1; page <= 4; page += 1) {
        const batch = usePublic
          ? await searchVersesPublicOrEmpty(q, page, SEARCH_PAGE_SIZE)
          : await searchVersesFoundationOrEmpty(q, page, SEARCH_PAGE_SIZE);
        if (!batch.length || pushBatch(batch)) break;
      }
    }
  } else {
    for (const q of list) {
      if (merged.length >= maxResults) break;
      for (let page = 1; page <= 4; page += 1) {
        const batch = await searchVersesPublicOrEmpty(q, page, SEARCH_PAGE_SIZE);
        if (!batch.length || pushBatch(batch)) break;
      }
    }
  }

  if (merged.length === 0) {
    throw new Error("No verses found for this query. Try another word or phrase.");
  }
  return merged;
}

export async function getAyahsByEmotion(rawQuery, sourceId = DEFAULT_TAFSEER_SOURCE) {
  const query = rawQuery?.trim();
  if (!query) {
    throw new Error("Please enter an emotion or situation.");
  }

  const themes = await interpretSearchThemes(query);
  const queries = themes && themes.length > 0 ? themes.slice(0, 5) : [query];
  const ayahs = await searchVersesMerged(queries);
  const enriched = await enrichAyahsWithTafsir(ayahs, sourceId);
  return { ayahs: enriched, themes: Array.isArray(themes) ? themes : [] };
}

export async function getAyahByVerseKey(rawVerseKey, sourceId = DEFAULT_TAFSEER_SOURCE) {
  const verseKey = rawVerseKey?.trim();
  if (!verseKey || !verseKey.includes(":")) {
    throw new Error("Invalid verse key.");
  }

  // Quran.com endpoints expect `chapter:ayah` literally in the path (do not encode the `:`).
  const pathKey = encodeURIComponent(verseKey).replace(/%3A/gi, ":");
  const surahNameMap = await getChapterNameMap();
  const chapterId = verseKey.split(":")?.[0] ?? "";

  // Try Foundation Content API when configured, but fall back to public Quran.com on any non-OK response.
  if (isQuranFoundationConfigured()) {
    try {
      const res = await quranFoundationFetch(
        `/verses/by_key/${pathKey}?language=en&words=false&translations=${TRANSLATION_RESOURCE_ID}&fields=text_uthmani`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const payload = await res.json();
        const verse = payload?.verse ?? payload?.result?.verse ?? null;
        if (verse) {
          const translationText = pickTranslation(verse.translations);
          const ayah = {
            id: verse.id,
            verseKey: verse.verse_key ?? verseKey,
            surahName: surahNameMap[chapterId] ?? (surahNameFromChapterId(chapterId) || `Surah ${chapterId}`),
            ayahNumber: Number(verseKey.split(":")?.[1] ?? 0),
            arabicText: verse.text_uthmani ?? verse.text ?? "",
            translation: translationText,
            tafseer: "",
          };
          return enrichAyahWithTafsir(ayah, sourceId);
        }
      }
    } catch {
      // ignore and fall back to public
    }
  }

  // Public fallback: Arabic only (translation may be missing depending on endpoint capabilities).
  const res = await publicOnlyFetch(`/verses/by_key/${pathKey}?fields=text_uthmani`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Unable to fetch verse at the moment.${formatOAuthDebugHint(res.status, text)}`);
  }
  const payload = await res.json();
  const verse = payload?.verse ?? null;
  const ayah = {
    id: verse?.id ?? stableNumericId(verseKey, 1),
    verseKey,
    surahName: surahNameMap[chapterId] ?? (surahNameFromChapterId(chapterId) || `Surah ${chapterId}`),
    ayahNumber: Number(verseKey.split(":")?.[1] ?? 0),
    arabicText: verse?.text_uthmani ?? "",
    translation: "",
    tafseer: "",
  };
  return enrichAyahWithTafsir(ayah, sourceId);
}

export function getContentApiMode() {
  if (!isQuranFoundationConfigured()) return "public";
  return isPublicSearchFallbackActive() ? "quran_foundation_public_search" : "quran_foundation";
}
