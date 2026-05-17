import { NextResponse } from "next/server";
import {
  getAyahsByEmotion,
  getContentApiMode,
  QuranSearchError,
  SearchErrorCode,
} from "@/lib/api/quran";
import { searchDebug } from "@/lib/search/searchDebug";

function statusForSearchError(error) {
  if (!(error instanceof QuranSearchError)) return 500;
  switch (error.code) {
    case SearchErrorCode.INVALID_QUERY:
      return 400;
    case SearchErrorCode.EMPTY:
      return 404;
    case SearchErrorCode.CONFIG:
    case SearchErrorCode.SDK_AUTH:
      return 401;
    case SearchErrorCode.NETWORK:
      return 503;
    default:
      return 500;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  searchDebug("api.ayahs.request", { query, mode: getContentApiMode() });

  try {
    const { ayahs, themes } = await getAyahsByEmotion(query);
    searchDebug("api.ayahs.success", { query, ayahCount: ayahs?.length ?? 0, themeCount: themes?.length ?? 0 });
    return NextResponse.json({ ayahs, themes, code: "SUCCESS" });
  } catch (error) {
    const message = error?.message || "Search request failed.";
    const code = error instanceof QuranSearchError ? error.code : SearchErrorCode.SDK;
    const status = statusForSearchError(error);

    searchDebug("api.ayahs.error", { query, code, status, message });

    return NextResponse.json({ code, message, ayahs: [], themes: [] }, { status });
  }
}
