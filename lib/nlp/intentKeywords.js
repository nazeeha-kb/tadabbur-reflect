import nlp from "compromise";

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "our",
  "their",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "here",
  "there",
  "then",
  "once",
  "am",
  "im",
  "ive",
  "dont",
  "doesnt",
  "didnt",
  "wont",
  "cant",
  "because",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "from",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "once",
  "feel",
  "feeling",
  "today",
  "really",
  "very",
]);

function normalizeTagWord(raw) {
  const w = String(raw || "")
    .trim()
    .toLowerCase();
  if (!w || w.length < 3) return "";
  if (STOP.has(w)) return "";
  const doc = nlp(w);
  const singular = doc.nouns().toSingular().text("text");
  const out = (singular || w).replace(/[^a-z-]/g, "");
  if (out.length < 3 || STOP.has(out)) return "";
  return out;
}

/**
 * Extract 3–8 candidate keywords from natural language (nouns + strong adjectives).
 */
export function extractIntentKeywords(text) {
  const t = String(text || "").trim();
  if (!t) return [];

  const doc = nlp(t);
  const candidates = [];

  doc.nouns().forEach((m) => {
    const term = normalizeTagWord(m.text("text"));
    if (term) candidates.push(term);
  });
  doc.adjectives().forEach((m) => {
    const term = normalizeTagWord(m.text("text"));
    if (term) candidates.push(term);
  });

  // Fallback: significant tokens if compromise misses (e.g. short inputs)
  if (candidates.length === 0) {
    t.split(/[\s,.;:!?'"()[\]]+/)
      .map((w) => normalizeTagWord(w))
      .filter(Boolean)
      .forEach((w) => candidates.push(w));
  }

  return [...new Set(candidates)];
}

function normalizeThemeTag(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s.length < 2) return "";
  const parts = s.split(" ");
  const compact = parts.length > 2 ? parts.slice(0, 2).join(" ") : s;
  return compact.length <= 28 ? compact : parts[0] || "";
}

function inferReflectionTagsNlp({ searchQuery = "", ayahTranslation = "", reflectionText = "" } = {}) {
  const combined = [searchQuery, ayahTranslation, reflectionText].filter(Boolean).join(" ");
  const fromNlp = extractIntentKeywords(combined);
  const scored = new Map();
  for (const w of fromNlp) {
    scored.set(w, (scored.get(w) || 0) + 1);
  }
  for (const w of extractIntentKeywords(searchQuery)) {
    scored.set(w, (scored.get(w) || 0) + 2);
  }

  const sorted = [...scored.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const tags = sorted.slice(0, 3);
  if (tags.length === 0 && searchQuery.trim()) {
    const parts = searchQuery.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    const fallback = normalizeTagWord(last);
    if (fallback) tags.push(fallback);
  }
  return tags;
}

/**
 * Pick 1–3 tags: AI themes first, then NLP from query + ayah + reflection.
 */
export function inferReflectionTags({
  searchQuery = "",
  ayahTranslation = "",
  reflectionText = "",
  themes = [],
} = {}) {
  const fromThemes = (Array.isArray(themes) ? themes : []).map(normalizeThemeTag).filter(Boolean);
  const uniqueThemes = [...new Set(fromThemes)];
  const nlpTags = inferReflectionTagsNlp({ searchQuery, ayahTranslation, reflectionText });
  return [...new Set([...uniqueThemes, ...nlpTags])].slice(0, 3);
}
