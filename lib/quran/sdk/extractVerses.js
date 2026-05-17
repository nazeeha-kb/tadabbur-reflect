/** Normalize Search API payloads (verses live under `result.verses`). */
export function extractSearchVerses(results) {
  if (!results) return [];
  if (Array.isArray(results)) return results;
  if (Array.isArray(results.verses)) return results.verses;
  if (Array.isArray(results.result?.verses)) return results.result.verses;
  return [];
}
