/**
 * Quran Foundation SDK — public server API.
 * Implementation lives in lib/quran/sdk/* (see official SDK docs).
 */
export {
  getAyahsByEmotion,
  getContentApiMode,
} from "@/lib/quran/sdk/emotionSearch";

export { getAyahByVerseKey } from "@/lib/quran/sdk/verses";

export {
  QuranSearchError,
  QfSdkAuthError,
  QfInvalidQueryError,
  SearchErrorCode,
} from "@/lib/quran/sdk/errors";

export { isQfSdkConfigured, getQfSdkClient } from "@/lib/quran/sdk/client";
