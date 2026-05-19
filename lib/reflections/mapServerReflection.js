import { deriveDisplaySyncStatus } from "@/lib/reflections/identity";

/** Map Firestore reflection document to UI list shape. */
export function mapServerReflection(r) {
  if (!r) return null;
  const createdAt =
    typeof r.createdAt === "string" ? r.createdAt : r.createdAt?.toDate?.()?.toISOString?.() || r.createdAt;
  const updatedAt =
    typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt?.toDate?.()?.toISOString?.() || r.updatedAt;

  const firebaseSyncStatus = r.firebaseSyncStatus || "synced";
  const qfSyncStatus = r.qfSyncStatus || (r.qfNoteId ? "synced" : "pending");

  return {
    ...r,
    id: r.id,
    serverId: r.id,
    reflectionText: r.reflectionText || r.reflection || "",
    emotion: r.emotion || r.searchQuery || "",
    searchQuery: r.searchQuery || r.emotion || "",
    ayahs:
      Array.isArray(r.ayahs) && r.ayahs.length > 0
        ? r.ayahs
        : r.verseKey
          ? [{ verseKey: r.verseKey }]
          : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || createdAt,
    firebaseSyncStatus,
    qfSyncStatus,
    syncStatus: deriveDisplaySyncStatus(firebaseSyncStatus, qfSyncStatus),
  };
}

export async function buildReflectionAuthHeaders() {
  const headers = {};
  try {
    const mod = await import("@/lib/firebase/firebaseClientAuth");
    const token = await mod.getFirebaseIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* guest or no firebase */
  }
  return headers;
}
