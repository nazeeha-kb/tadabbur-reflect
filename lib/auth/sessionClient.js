const SESSION_TTL_MS = 30_000;

let cachedSession = null;
let cacheExpiresAt = 0;
/** @type {Promise<object> | null} */
let inFlight = null;

export function invalidateSessionCache() {
  cachedSession = null;
  cacheExpiresAt = 0;
}

/**
 * Deduped session fetch with short TTL (avoids validate spam on navigation).
 */
export async function fetchSessionCached() {
  const now = Date.now();
  if (cachedSession && now < cacheExpiresAt) {
    return cachedSession;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      });
      const data = res.ok ? await res.json() : { authenticated: false };
      cachedSession = data;
      cacheExpiresAt = Date.now() + SESSION_TTL_MS;
      return data;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
