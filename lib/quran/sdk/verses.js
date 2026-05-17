import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { getChapterNameMap } from "@/lib/quran/sdk/chapters";
import { mapVerseToAyah } from "@/lib/quran/sdk/mapAyah";
import { resolveTranslationResourceId } from "@/lib/quran/sdk/resources";
import { fetchTafsirForVerseWithFallback } from "@/lib/quran/sdk/tafsir";
import { QuranSearchError, SearchErrorCode, toQuranSearchError } from "@/lib/quran/sdk/errors";
import { searchDebug } from "@/lib/search/searchDebug";

/**
 * Full verse load for a single ayah (reflection page). Verse text first; tafsir never fails the request.
 */
export async function getAyahByVerseKey(rawVerseKey, optionsOrTafseerSource) {
  const options =
    typeof optionsOrTafseerSource === "string"
      ? { tafseerSourceId: optionsOrTafseerSource }
      : optionsOrTafseerSource || {};

  const verseKey = rawVerseKey?.trim();
  if (!verseKey || !verseKey.includes(":")) {
    throw new QuranSearchError(SearchErrorCode.INVALID_QUERY, "Invalid verse key.");
  }

  try {
    const client = getQfSdkClient();
    const [chapterNameMap, translationId] = await Promise.all([
      getChapterNameMap(),
      resolveTranslationResourceId(),
    ]);

    const verse = await client.content.v4.verses.byKey(verseKey, {
      translations: [translationId],
      words: false,
    });

    if (!verse) {
      throw new QuranSearchError(SearchErrorCode.SDK, `Verse not found: ${verseKey}`);
    }

    const ayah = mapVerseToAyah(verse, chapterNameMap, 0, translationId);

    if (options.tafseerSourceId) {
      const tafseer = await fetchTafsirForVerseWithFallback(verseKey, options.tafseerSourceId);
      return { ...ayah, tafseer };
    }

    return { ...ayah, tafseer: ayah.tafseer || null };
  } catch (err) {
    if (err instanceof QuranSearchError) throw err;
    searchDebug("sdk.verse.load_error", { verseKey, message: err?.message });
    throw toQuranSearchError(err, `Failed to load verse ${verseKey}.`);
  }
}
