/**
 * Client-side stats from stored reflections (localStorage-backed).
 */

function dayStartMs(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Consecutive calendar days with ≥1 reflection, counting backward from today (local). */
export function getDailyReflectionStreak(reflections) {
  if (!Array.isArray(reflections) || reflections.length === 0) return 0;
  const days = new Set(reflections.map((r) => dayStartMs(r.createdAt)));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = today.getTime();
  const dayMs = 86400000;
  for (;;) {
    if (!days.has(cursor)) break;
    streak += 1;
    cursor -= dayMs;
  }
  return streak;
}

export function getMostFrequentTag(reflections) {
  if (!Array.isArray(reflections) || reflections.length === 0) return null;
  const counts = new Map();
  for (const r of reflections) {
    for (const t of r.tags || []) {
      const k = String(t).trim().toLowerCase();
      if (!k) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let best = null;
  let bestN = 0;
  for (const [tag, n] of counts) {
    if (n > bestN || (n === bestN && tag < best)) {
      best = tag;
      bestN = n;
    }
  }
  return best;
}

export function getLastReflectionDateIso(reflections) {
  if (!Array.isArray(reflections) || reflections.length === 0) return null;
  let best = null;
  for (const r of reflections) {
    const t = new Date(r.createdAt).getTime();
    if (!Number.isFinite(t)) continue;
    if (best == null || t > best) best = t;
  }
  return best != null ? new Date(best).toISOString() : null;
}

export function formatInsightMonthDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
