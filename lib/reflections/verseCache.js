const CACHE_PREFIX = "reflect-verse:";

export function cacheVerseForReflection(verse) {
  if (typeof window === "undefined" || !verse?.verseKey) return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${verse.verseKey}`, JSON.stringify(verse));
  } catch {
    /* ignore quota */
  }
}

export function getCachedVerse(verseKey) {
  if (typeof window === "undefined" || !verseKey) return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${verseKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
