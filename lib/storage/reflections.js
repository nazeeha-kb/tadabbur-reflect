const STORAGE_KEY = "quran-reflect-reflections";

export function getStoredReflections() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReflection(reflection) {
  if (typeof window === "undefined") return;
  const previous = getStoredReflections();
  const next = [reflection, ...previous];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
