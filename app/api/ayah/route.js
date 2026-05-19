import { NextResponse } from "next/server";
import { getAyahByVerseKey, QuranSearchError, SearchErrorCode } from "@/lib/api/quran";

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const verseKey = searchParams.get("verseKey");
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

  try {
    const ayah = await getAyahByVerseKey(verseKey, {
      tafseerSourceId: tafseerSource || undefined,
      prefill,
    });
    return NextResponse.json({ ayah, code: "SUCCESS" });
  } catch (error) {
    if (prefill?.verseKey && prefill.arabicText && prefill.translation) {
      const tafseer = tafseerSource
        ? await import("@/lib/quran/sdk/tafsir").then((m) =>
            m.fetchTafsirForVerseWithFallback(verseKey, tafseerSource),
          )
        : null;
      return NextResponse.json({
        ayah: {
          id: verseKey,
          verseKey,
          arabicText: prefill.arabicText,
          translation: prefill.translation,
          surahName: prefill.surahName || "",
          tafseer,
        },
        code: "PARTIAL",
      });
    }

    const code = error instanceof QuranSearchError ? error.code : SearchErrorCode.SDK;
    const message = error?.message || "Failed to fetch ayah.";
    const status = statusForSearchError(error);
    return NextResponse.json({ code, message, ayah: null }, { status });
  }
}
