export const TAFSEER_SOURCES = [
  { id: "tazkirul-quran", label: "Tazkirul Quran", resourceId: 817 },
  { id: "ibn-kathir-abridged", label: "Ibn Kathir (Abridged)", resourceId: 169 },
];

export const DEFAULT_TAFSEER_SOURCE = TAFSEER_SOURCES[0].id;

export function getTafseerSourceMeta(sourceId) {
  return TAFSEER_SOURCES.find((item) => item.id === sourceId) || TAFSEER_SOURCES[0];
}
