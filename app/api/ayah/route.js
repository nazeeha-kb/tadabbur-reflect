import { NextResponse } from "next/server";
import { getAyahByVerseKey, QuranSearchError, SearchErrorCode } from "@/lib/api/quran";
import { fetchTafsirForVerseWithFallback } from "@/lib/quran/sdk/tafsir";

function statusForSearchError(error) {
  if (!(error instanceof QuranSearchError)) return 500;
  switch (error.code) {
    case SearchErrorCode.INVALID_QUERY:
      return 400;
    case SearchErrorCode.SDK_AUTH:
    case SearchErrorCode.CONFIG:
      return 401;
    case SearchErrorCode.NETWORK:
      return 503;
    default:
      return 500;
  }
}

async function buildPartialAyah(verseKey, { arabicText, translation, surahName, tafseerSource }) {
  const partial = {
    id: verseKey,
    verseKey,
    arabicText: arabicText || "",
    translation: translation || "",
    surahName: surahName || "",
    tafseer: null,
  };
  if (tafseerSource) {
    partial.tafseer = await fetchTafsirForVerseWithFallback(verseKey, tafseerSource);
  }
  return partial;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey")?.trim() || "";
  const tafseerSource = searchParams.get("tafseer");
  const arabicText = searchParams.get("arabicText");
  const translation = searchParams.get("translation");
  const surahName = searchParams.get("surahName");

  const prefill =
    arabicText || translation
      ? {
          verseKey,
          arabicText: arabicText || "",
          translation: translation || "",
          surahName: surahName || "",
        }
      : null;

  if (!verseKey.includes(":")) {
    return NextResponse.json(
      { code: SearchErrorCode.INVALID_QUERY, message: "Invalid verse key.", ayah: null },
      { status: 400 },
    );
  }

  try {
    const ayah = await getAyahByVerseKey(verseKey, {
      tafseerSourceId: tafseerSource || undefined,
      prefill,
    });
    return NextResponse.json({ ayah, code: "SUCCESS" });
  } catch (error) {
    if (prefill?.arabicText || prefill?.translation) {
      const ayah = await buildPartialAyah(verseKey, {
        ...prefill,
        tafseerSource: tafseerSource || undefined,
      });
      return NextResponse.json({ ayah, code: "PARTIAL" });
    }

    const code = error instanceof QuranSearchError ? error.code : SearchErrorCode.SDK;
    const message = error?.message || "Failed to fetch ayah.";

    if (code !== SearchErrorCode.INVALID_QUERY) {
      const ayah = await buildPartialAyah(verseKey, {
        arabicText: "",
        translation: "",
        surahName: "",
        tafseerSource: tafseerSource || undefined,
      });
      return NextResponse.json({
        ayah,
        code: "PARTIAL",
        message: "Verse text unavailable; tafsir loaded when possible.",
      });
    }

    return NextResponse.json(
      { code, message, ayah: null },
      { status: statusForSearchError(error) },
    );
  }
}
