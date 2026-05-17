import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { surahNameFromChapterId } from "@/lib/quran/surahNames";

let chapterNameMap = null;

export async function getChapterNameMap() {
  if (chapterNameMap) return chapterNameMap;

  const client = getQfSdkClient();
  const chapters = await client.content.v4.chapters.list();

  chapterNameMap = chapters.reduce((acc, chapter) => {
    acc[String(chapter.id)] = chapter.nameSimple || chapter.name_simple || chapter.nameArabic || chapter.name_arabic;
    return acc;
  }, {});

  return chapterNameMap;
}

export function surahLabelForVerseKey(verseKey, chapterNameMap) {
  const chapterId = String(verseKey).split(":")[0] ?? "";
  return (chapterNameMap[chapterId] ?? surahNameFromChapterId(chapterId)) || `Surah ${chapterId}`;
}
