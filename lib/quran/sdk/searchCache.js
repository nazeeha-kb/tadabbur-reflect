import "server-only";

import { getAyahsByEmotion } from "@/lib/quran/sdk/emotionSearch";
import { withRetryOnce, withTimeout } from "@/lib/quran/sdk/requestUtils";

const CACHE_TTL_MS = 3 * 60 * 1000;
const SEARCH_TIMEOUT_MS = 5500;

/** @type {Map<string, { value: object, expiresAt: number }>} */
const resultCache = new Map();

/** @type {Map<string, Promise<object>>} */
const inFlight = new Map();

function cacheKey(query) {
  return query.trim().toLowerCase();
}

function log(event, meta = {}) {
  console.info(JSON.stringify({ event, ...meta }));
}

function getCached(key) {
  const entry = resultCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resultCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  resultCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function runSearch(query) {
  return withRetryOnce(
    () =>
      withTimeout(() => getAyahsByEmotion(query), {
        timeoutMs: SEARCH_TIMEOUT_MS,
        label: "search",
      }),
    {
      logRetry: (meta) => log("search.retry", { query, ...meta }),
    },
  );
}

/**
 * Cached, deduplicated emotion search with stale fallback on failure.
 */
export async function getAyahsByEmotionCached(rawQuery) {
  const query = rawQuery?.trim();
  if (!query) {
    const { QfInvalidQueryError } = await import("@/lib/quran/sdk/errors");
    throw new QfInvalidQueryError("Please enter an emotion or situation.");
  }

  const key = cacheKey(query);
  const cached = getCached(key);
  if (cached) {
    log("search.cache_hit", { query });
    return cached;
  }
  log("search.cache_miss", { query });

  if (inFlight.has(key)) {
    log("search.deduped", { query });
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const result = await runSearch(query);
      setCache(key, result);
      return result;
    } catch (err) {
      const stale = resultCache.get(key);
      if (stale?.value) {
        log("search.stale_fallback", { query, message: String(err?.message || err) });
        return stale.value;
      }
      if (err?.code === "TIMEOUT" || err?.name === "TimeoutError") {
        log("search.timeout", { query });
      }
      throw err;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
