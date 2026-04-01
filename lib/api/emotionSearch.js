/**
 * Map colloquial feelings to English search terms so we don't match
 * unrelated hits (e.g. "sad" → Arabic letter Sâd / Ṣād in Surah Sad).
 */

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
