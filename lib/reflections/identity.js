/** Client UUID v4 */
export const TEMP_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isTempReflectionId(id) {
  if (!id) return true;
  const s = String(id);
  if (s.startsWith("local-")) return true;
  return TEMP_UUID_RE.test(s);
}

export function getServerReflectionId(reflection) {
  if (!reflection) return null;
  if (reflection.serverId && !isTempReflectionId(reflection.serverId)) {
    return String(reflection.serverId);
  }
  if (reflection.id && !isTempReflectionId(reflection.id)) {
    return String(reflection.id);
  }
  return null;
}

/** Legacy badge field derived from split statuses */
export function deriveDisplaySyncStatus(firebaseSyncStatus, qfSyncStatus) {
  if (firebaseSyncStatus === "local") return "local";
  if (firebaseSyncStatus === "failed") return "failed";
  if (firebaseSyncStatus === "syncing") return "syncing";
  if (qfSyncStatus === "syncing" || qfSyncStatus === "pending") return "syncing";
  return "synced";
}

export function normalizeReflectionFields(row) {
  if (!row) return row;
  const firebaseSyncStatus =
    row.firebaseSyncStatus ||
    (row.syncStatus === "local" ? "local" : row.syncStatus === "failed" ? "failed" : "synced");
  const qfSyncStatus = row.qfSyncStatus || (row.qfNoteId ? "synced" : "pending");
  const serverId = getServerReflectionId(row);
  const next = {
    ...row,
    firebaseSyncStatus,
    qfSyncStatus,
    syncStatus: deriveDisplaySyncStatus(firebaseSyncStatus, qfSyncStatus),
  };
  if (serverId) {
    next.serverId = serverId;
    next.id = serverId;
  }
  return next;
}

export const REFLECTION_STORAGE_EVENT = "reflection-storage-updated";

export function dispatchReflectionStorageEvent(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REFLECTION_STORAGE_EVENT, { detail }));
}
