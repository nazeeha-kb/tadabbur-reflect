/**
 * Map colloquial feelings to English search terms so we don't match
 * unrelated hits (e.g. "sad" → Arabic letter Sâd / Ṣād in Surah Sad).
 */

import { extractIntentKeywords } from "@/lib/nlp/intentKeywords";

const PHRASES = [
  ["sad", "grief"],
  ["sadness", "grief"],
  ["depressed", "grief"],
  ["lonely", "solitude"],
  ["loneliness", "solitude"],
  ["anxious", "anxiety"],
  ["anxiety", "anxiety"],
  ["angry", "anger"],
  ["anger", "anger"],
  ["afraid", "fear"],
  ["fear", "fear"],
  ["hope", "hope"],
  ["hopeless", "hope"],
  ["grateful", "gratitude"],
  ["gratitude", "gratitude"],
  ["tired", "weariness"],
  ["stress", "hardship"],
  ["worried", "worry"],
];

const MAP = new Map(PHRASES);

export function emotionToSearchQuery(rawInput) {
  const trimmed = rawInput?.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const firstWord = lower.split(/\s+/)[0];

  if (MAP.has(lower)) return MAP.get(lower);
  if (MAP.has(firstWord)) return MAP.get(firstWord);

  return trimmed;
}

/**
 * Build multiple search strings from natural language: colloquial map + NLP keywords.
 * Used to run several Quran.com searches and merge unique verses (intent-aware, scalable).
 */
export function buildSearchQueriesForIntent(rawInput) {
  const trimmed = rawInput?.trim();
  if (!trimmed) return [];

  const primary = emotionToSearchQuery(trimmed);
  const keywords = extractIntentKeywords(trimmed);

  const out = [];
  const push = (s) => {
    const v = String(s || "").trim();
    if (v) out.push(v);
  };

  push(primary);

  const primaryLower = primary.toLowerCase();
  for (const k of keywords) {
    if (!k) continue;
    if (k === primaryLower) continue;
    push(k);
  }

  if (out.length === 0) push(trimmed);

  const seen = new Set();
  const deduped = [];
  for (const q of out) {
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(q);
  }

  return deduped.slice(0, 6);
}
