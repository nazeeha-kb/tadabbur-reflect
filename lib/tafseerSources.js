/** resourceId/slug hints — resolved against live SDK catalog per QF_ENV */
export const TAFSEER_SOURCES = [
  { id: "ibn-kathir-abridged", label: "Ibn Kathir (Abridged)", resourceId: 169, slug: "en-tafisr-ibn-kathir" },
  { id: "tazkirul-quran", label: "Tazkirul Quran", resourceId: 159, slug: "tafsir-bayan-ul-quran" },
];

export const DEFAULT_TAFSEER_SOURCE = TAFSEER_SOURCES[0].id;

export function getTafseerSourceMeta(sourceId) {
  return TAFSEER_SOURCES.find((item) => item.id === sourceId) || TAFSEER_SOURCES[0];
}
