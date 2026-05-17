import { SearchMode } from "@quranjs/api";
import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { MAX_SEARCH_PAGES, MAX_SEARCH_RESULTS, SEARCH_PAGE_SIZE } from "@/lib/quran/sdk/constants";
import { resolveTranslationResourceId } from "@/lib/quran/sdk/resources";
import { extractSearchVerses } from "@/lib/quran/sdk/extractVerses";
import { mapSearchHitToVerseResult } from "@/lib/quran/sdk/mapSearchHit";
import { QuranSearchError, SearchErrorCode, toQuranSearchError } from "@/lib/quran/sdk/errors";
import { searchDebug } from "@/lib/search/searchDebug";

async function querySearchPage(client, query, page, translationId) {
  const results = await client.search.v1.query({
    query,
    mode: SearchMode.Advanced,
    page,
    size: SEARCH_PAGE_SIZE,
    translationIds: [translationId],
    getText: "1",
  });

  const hits = extractSearchVerses(results);
  searchDebug("sdk.search.page", { query, page, hitCount: hits.length });

  return hits.map((hit, index) => mapSearchHitToVerseResult(hit, index));
}

/**
 * Step A only: SDK search with inline arabic + translation (no per-verse hydration).
 */
export async function searchVersesForQuery(query) {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const client = getQfSdkClient();
  const translationId = await resolveTranslationResourceId();
  const merged = [];
  const seen = new Set();

  try {
    for (let page = 1; page <= MAX_SEARCH_PAGES; page += 1) {
      const pageHits = await querySearchPage(client, trimmed, page, translationId);
      if (!pageHits.length) break;

      for (const verse of pageHits) {
        if (!verse.verseKey || seen.has(verse.verseKey)) continue;
        seen.add(verse.verseKey);
        merged.push(verse);
        if (merged.length >= MAX_SEARCH_RESULTS) break;
      }

      if (merged.length >= MAX_SEARCH_RESULTS || pageHits.length < SEARCH_PAGE_SIZE) break;
    }
  } catch (err) {
    searchDebug("sdk.search.failed", { query: trimmed, message: err?.message });
    throw toQuranSearchError(err);
  }

  return merged;
}

/** @deprecated Use searchVersesForQuery — kept for imports during migration */
export async function searchVersesMerged(queries) {
  const list = Array.isArray(queries) ? queries.map((q) => String(q).trim()).filter(Boolean) : [];
  if (list.length === 0) {
    throw new QuranSearchError(SearchErrorCode.INVALID_QUERY, "Please enter a search term.");
  }

  const seen = new Set();
  const merged = [];

  for (const q of list) {
    if (merged.length >= MAX_SEARCH_RESULTS) break;
    const batch = await searchVersesForQuery(q);
    for (const verse of batch) {
      if (!verse?.verseKey || seen.has(verse.verseKey)) continue;
      seen.add(verse.verseKey);
      merged.push(verse);
      if (merged.length >= MAX_SEARCH_RESULTS) break;
    }
  }

  return merged;
}
