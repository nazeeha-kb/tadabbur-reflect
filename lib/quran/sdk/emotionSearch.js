import { interpretSearchThemes } from "@/lib/api/openrouterThemes";
import { isQfSdkConfigured } from "@/lib/quran/sdk/client";
import { searchVersesForQuery } from "@/lib/quran/sdk/search";
import { QuranSearchError, QfInvalidQueryError, SearchErrorCode } from "@/lib/quran/sdk/errors";
import { searchDebug } from "@/lib/search/searchDebug";

export async function getAyahsByEmotion(rawQuery) {
  const query = rawQuery?.trim();
  if (!query) {
    throw new QfInvalidQueryError("Please enter an emotion or situation.");
  }

  if (!isQfSdkConfigured()) {
    throw new QuranSearchError(
      SearchErrorCode.CONFIG,
      "Quran Foundation is not configured. Set QF_CLIENT_ID, QF_CLIENT_SECRET, and QF_ENV.",
    );
  }

  searchDebug("emotionSearch.start", { query });

  const [themes, ayahs] = await Promise.all([
    interpretSearchThemes(query),
    searchVersesForQuery(query),
  ]);

  searchDebug("emotionSearch.done", {
    ayahCount: ayahs.length,
    themeCount: themes?.length ?? 0,
    hydration: "none",
  });

  if (ayahs.length === 0) {
    throw new QuranSearchError(SearchErrorCode.EMPTY, `No results found for "${query}".`);
  }

  return { ayahs, themes: Array.isArray(themes) ? themes : [] };
}

export function getContentApiMode() {
  return isQfSdkConfigured() ? "quran_foundation" : "unconfigured";
}
