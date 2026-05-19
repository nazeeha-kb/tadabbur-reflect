import "server-only";

const CACHE_TTL_MS = 10 * 60 * 1000;

/** @type {Map<string, { text: string | null, sourceId: string | null, expiresAt: number }>} */
const cache = new Map();

export function tafseerCacheKey(verseKey, tafseerSource) {
  return `${verseKey}:${tafseerSource || "default"}`;
}

export function getCachedTafseer(verseKey, tafseerSource) {
  const key = tafseerCacheKey(verseKey, tafseerSource);
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

export function setCachedTafseer(verseKey, tafseerSource, text, resolvedSourceId) {
  const key = tafseerCacheKey(verseKey, tafseerSource);
  cache.set(key, {
    text,
    sourceId: resolvedSourceId ?? null,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
