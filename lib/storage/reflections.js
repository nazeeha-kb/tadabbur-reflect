const STORAGE_KEY = "quran-reflect-reflections";

export function getStoredReflections() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => {
      const searchQuery =
        (typeof r.searchQuery === "string" && r.searchQuery.trim()) ||
        (typeof r.emotion === "string" && r.emotion.trim()) ||
        (typeof r.userInput === "string" && r.userInput.trim()) ||
        "";
      return {
        ...r,
        searchQuery,
        tags: Array.isArray(r.tags) ? r.tags : [],
      };
    });
  } catch {
    return [];
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
}

export function saveReflection(reflection) {
  if (typeof window === "undefined") return;
  const previous = getStoredReflections();
  const searchQuery =
    (typeof reflection.searchQuery === "string" && reflection.searchQuery.trim()) ||
    (typeof reflection.emotion === "string" && reflection.emotion.trim()) ||
    (typeof reflection.userInput === "string" && reflection.userInput.trim()) ||
    "";
  const entry = {
    ...reflection,
    searchQuery,
    emotion: reflection.emotion?.trim() || searchQuery || reflection.emotion,
    tags: normalizeTags(reflection.tags),
  };
  const next = [entry, ...previous];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getReflectionById(id) {
  if (typeof id !== "string" || !id.trim()) return null;
  return getStoredReflections().find((r) => r.id === id) ?? null;
}

export function updateReflection(id, updates) {
  if (typeof window === "undefined") return false;
  const list = getStoredReflections();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const prev = list[idx];
  const merged = { ...prev, ...updates };
  const searchQuery =
    (typeof merged.searchQuery === "string" && merged.searchQuery.trim()) ||
    (typeof merged.emotion === "string" && merged.emotion.trim()) ||
    (typeof merged.userInput === "string" && merged.userInput.trim()) ||
    "";
  const nextEntry = {
    ...merged,
    searchQuery,
    tags: updates.tags !== undefined ? normalizeTags(updates.tags) : prev.tags ?? [],
    id: prev.id,
    updatedAt: new Date().toISOString(),
  };
  const next = [...list];
  next[idx] = nextEntry;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}

export function deleteReflection(id) {
  if (typeof window === "undefined") return false;
  const list = getStoredReflections();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}
