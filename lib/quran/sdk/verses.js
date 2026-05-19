import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { getChapterNameMap } from "@/lib/quran/sdk/chapters";
import { mapVerseToAyah } from "@/lib/quran/sdk/mapAyah";
import { resolveTranslationResourceId } from "@/lib/quran/sdk/resources";
import { fetchTafsirForVerseWithFallback } from "@/lib/quran/sdk/tafsir";
import { QuranSearchError, SearchErrorCode, toQuranSearchError } from "@/lib/quran/sdk/errors";
import { searchDebug } from "@/lib/search/searchDebug";
import { withTimeout } from "@/lib/quran/sdk/requestUtils";

/**
 * Full or partial verse load. When prefill has arabic + translation, skips Content API verse fetch.
 * Tafsir never fails the request.
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

  const prefill = options.prefill || {};
  const hasPrefillText =
    Boolean(prefill.arabicText?.trim()) && Boolean(prefill.translation?.trim());

  try {
    let ayah;

    if (hasPrefillText) {
      const [chapterNameMap] = await Promise.all([getChapterNameMap()]);
      const [surah, ayahNum] = verseKey.split(":").map((p) => Number(p));
      ayah = {
        id: verseKey,
        verseKey,
        surahNumber: surah,
        ayahNumber: ayahNum,
        surahName: prefill.surahName || chapterNameMap[surah] || "",
        arabicText: prefill.arabicText,
        translation: prefill.translation,
        tafseer: prefill.tafseer || null,
      };
    } else {
      const client = getQfSdkClient();
      const [chapterNameMap, translationId] = await Promise.all([
        getChapterNameMap(),
        resolveTranslationResourceId(),
      ]);

      let verse;
      try {
        verse = await withTimeout(
          () =>
            client.content.v4.verses.byKey(verseKey, {
              translations: [translationId],
              words: false,
            }),
          { timeoutMs: 5000, label: "verse" },
        );
      } catch (loadErr) {
        searchDebug("sdk.verse.load_error", { verseKey, message: loadErr?.message });
        const [surah, ayahNum] = verseKey.split(":").map((p) => Number(p));
        const partialArabic = prefill.arabicText?.trim() || "";
        const partialTranslation = prefill.translation?.trim() || "";
        if (partialArabic || partialTranslation || prefill.verseKey === verseKey) {
          ayah = {
            id: verseKey,
            verseKey,
            surahNumber: surah,
            ayahNumber: ayahNum,
            surahName: prefill.surahName || "",
            arabicText: partialArabic,
            translation: partialTranslation,
            tafseer: null,
          };
        } else {
          throw loadErr;
        }
      }

      if (!verse && !ayah) {
        throw new QuranSearchError(SearchErrorCode.SDK, `Verse not found: ${verseKey}`);
      }

      if (verse) {
        ayah = mapVerseToAyah(verse, chapterNameMap, 0, translationId);
      }
    }

    if (options.tafseerSourceId) {
      const tafseer = await fetchTafsirForVerseWithFallback(verseKey, options.tafseerSourceId);
      return { ...ayah, tafseer: tafseer ?? ayah.tafseer ?? null };
    }

    return { ...ayah, tafseer: ayah.tafseer || null };
  } catch (err) {
    if (err instanceof QuranSearchError) throw err;
    searchDebug("sdk.verse.load_error", { verseKey, message: err?.message });
    throw toQuranSearchError(err, `Failed to load verse ${verseKey}.`);
  }
}
