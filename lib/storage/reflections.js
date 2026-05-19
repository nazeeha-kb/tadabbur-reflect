import {
  deriveDisplaySyncStatus,
  dispatchReflectionStorageEvent,
  getServerReflectionId,
  isTempReflectionId,
  normalizeReflectionFields,
} from "@/lib/reflections/identity";

const STORAGE_KEY = "quran-reflect-reflections";

function reflectionLog(event, meta = {}) {
  console.info(JSON.stringify({ event: `reflection.${event}`, ...meta }));
}

export function getStoredReflections() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return dedupeReflections(
      parsed.map((r) => {
        const searchQuery =
          (typeof r.searchQuery === "string" && r.searchQuery.trim()) ||
          (typeof r.emotion === "string" && r.emotion.trim()) ||
          (typeof r.userInput === "string" && r.userInput.trim()) ||
          "";
        return normalizeReflectionFields({
          ...r,
          searchQuery,
          tags: Array.isArray(r.tags) ? r.tags : [],
        });
      }),
    );
  } catch {
    return [];
  }
}

function persistReflections(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeReflections(list)));
}

function findReflectionIndex(list, idOrTempId) {
  if (!idOrTempId) return -1;
  return list.findIndex(
    (r) => r.id === idOrTempId || r.tempId === idOrTempId || r.serverId === idOrTempId,
  );
}

export function findReflection(idOrTempId) {
  const list = getStoredReflections();
  const idx = findReflectionIndex(list, idOrTempId);
  return idx === -1 ? null : list[idx];
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
}

export function reflectionIdentityKey(reflection) {
  const serverId = getServerReflectionId(reflection);
  if (serverId) return `id:${serverId}`;
  const createdAt = reflection?.createdAt ? String(reflection.createdAt) : "";
  const verseKey = reflection?.verseKey ? String(reflection.verseKey) : "";
  const text = String(reflection?.reflectionText || reflection?.text || "").trim();
  return `fallback:${createdAt}|${verseKey}|${text}`;
}

export function dedupeReflections(list) {
  const seen = new Set();
  const normalized = [];
  for (const row of Array.isArray(list) ? list : []) {
    const key = reflectionIdentityKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    normalized.push(row);
  }
  return normalized;
}

async function buildAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const mod = await import("../firebase/firebaseClientAuth");
    const token = await mod.getFirebaseIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

/**
 * Replace temp UUID with Firestore id everywhere in localStorage.
 */
export function replaceReflectionIdentity(tempId, serverReflection) {
  const serverId = serverReflection?.id;
  if (!tempId || !serverId) return null;

  const list = getStoredReflections();
  const tempIdx = findReflectionIndex(list, tempId);

  const firebaseSyncStatus = serverReflection.firebaseSyncStatus || "synced";
  const qfSyncStatus = serverReflection.qfSyncStatus || "syncing";

  const nextRow = normalizeReflectionFields({
    ...(tempIdx >= 0 ? list[tempIdx] : {}),
    ...serverReflection,
    id: serverId,
    serverId,
    firebaseSyncStatus,
    qfSyncStatus,
    qfNoteId: serverReflection.qfNoteId ?? list[tempIdx]?.qfNoteId,
    createdAt: serverReflection.createdAt || list[tempIdx]?.createdAt,
    updatedAt: serverReflection.updatedAt || new Date().toISOString(),
  });
  delete nextRow.tempId;

  const next = list.filter((r, i) => {
    if (i === tempIdx) return false;
    if (r.id === serverId) return false;
    if (r.tempId === tempId) return false;
    if (r.id === tempId && isTempReflectionId(r.id)) return false;
    return true;
  });

  if (tempIdx >= 0) {
    next.splice(tempIdx, 0, nextRow);
  } else {
    next.unshift(nextRow);
  }

  persistReflections(next);
  reflectionLog("identity.replaced", { tempId, serverId });
  dispatchReflectionStorageEvent({ tempId, serverId, reflection: nextRow });
  return nextRow;
}

function patchLocalReflection(idOrTempId, patch) {
  const list = getStoredReflections();
  const idx = findReflectionIndex(list, idOrTempId);
  if (idx === -1) return;
  list[idx] = normalizeReflectionFields({ ...list[idx], ...patch });
  persistReflections(list);
}

export function saveReflection(reflection) {
  if (typeof window === "undefined") return null;

  const tempId =
    reflection.tempId ||
    (isTempReflectionId(reflection.id) ? reflection.id : null) ||
    crypto?.randomUUID?.() ||
    `local-${Date.now()}`;

  if (!saveReflection._inFlight) saveReflection._inFlight = new Map();
  const createKey = `create:${tempId}`;
  if (saveReflection._inFlight.has(createKey)) {
    reflectionLog("create.deduped", { tempId });
    return tempId;
  }

  const previous = getStoredReflections();
  const searchQuery =
    (typeof reflection.searchQuery === "string" && reflection.searchQuery.trim()) ||
    (typeof reflection.emotion === "string" && reflection.emotion.trim()) ||
    (typeof reflection.userInput === "string" && reflection.userInput.trim()) ||
    "";

  const entry = normalizeReflectionFields({
    ...reflection,
    tempId,
    id: tempId,
    searchQuery,
    emotion: reflection.emotion?.trim() || searchQuery || reflection.emotion,
    tags: normalizeTags(reflection.tags),
    firebaseSyncStatus: "syncing",
    qfSyncStatus: "pending",
    syncStatus: "syncing",
  });

  const withoutDup = previous.filter((r) => r.tempId !== tempId && r.id !== tempId);
  persistReflections([entry, ...withoutDup]);

  const task = (async () => {
    try {
      const headers = await buildAuthHeaders();
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          verseKey: entry.verseKey,
          text: entry.reflectionText || entry.text || "",
          reflectionText: entry.reflectionText || entry.text || "",
          emotion: entry.emotion || "",
          title: entry.title || "",
          tags: entry.tags || [],
          tafseer: entry.tafseerSource || entry.tafseer || null,
          ayahs: entry.ayahs || [],
          searchQuery: entry.searchQuery || "",
        }),
      });

      if (!res.ok) {
        try {
          const { toast } = await import("sonner");
          if (res.status === 401) {
            toast.error("Sign in to sync reflections across devices.");
          } else {
            toast.error("Failed to sync reflection. It will retry in background.");
          }
        } catch {
          /* ignore */
        }
        patchLocalReflection(tempId, {
          firebaseSyncStatus: res.status === 401 ? "local" : "failed",
          qfSyncStatus: "pending",
        });
        return;
      }

      const payload = await res.json();
      const serverReflection = payload?.reflection || null;
      if (serverReflection?.id) {
        replaceReflectionIdentity(tempId, serverReflection);
      }
    } catch {
      try {
        const { toast } = await import("sonner");
        toast.error("Failed to sync reflection. It will retry in background.");
      } catch {
        /* ignore */
      }
      patchLocalReflection(tempId, { firebaseSyncStatus: "failed", qfSyncStatus: "pending" });
    }
  })();

  saveReflection._inFlight.set(createKey, task);
  task.finally(() => saveReflection._inFlight.delete(createKey));

  return tempId;
}

export function getReflectionById(id) {
  return findReflection(id);
}

export async function waitForServerReflectionId(idOrTempId, { timeoutMs = 15000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = findReflection(idOrTempId);
    const serverId = getServerReflectionId(row);
    if (serverId) return serverId;
    const createKey = `create:${row?.tempId || idOrTempId}`;
    const inflight = saveReflection._inFlight?.get(createKey);
    if (inflight) await inflight;
    else await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

export function updateReflection(id, updates) {
  if (typeof window === "undefined") return false;

  const row = findReflection(id);
  if (!row) return false;

  const lookupKey = row.tempId || row.id;
  const serverId = getServerReflectionId(row);

  const searchQuery =
    (typeof updates.searchQuery === "string" && updates.searchQuery.trim()) ||
    (typeof updates.emotion === "string" && updates.emotion.trim()) ||
    row.searchQuery ||
    "";

  patchLocalReflection(lookupKey, {
    ...updates,
    searchQuery: updates.searchQuery !== undefined ? searchQuery : row.searchQuery,
    tags: updates.tags !== undefined ? normalizeTags(updates.tags) : row.tags,
    updatedAt: new Date().toISOString(),
    firebaseSyncStatus: serverId ? "syncing" : row.firebaseSyncStatus,
    qfSyncStatus: serverId ? "syncing" : row.qfSyncStatus,
    syncStatus: "syncing",
  });

  if (!serverId) {
    reflectionLog("patch.deferred", { id: lookupKey, reason: "awaiting_server_id" });
    void (async () => {
      const resolved = await waitForServerReflectionId(lookupKey);
      if (resolved) updateReflection(resolved, updates);
    })();
    return true;
  }

  if (!updateReflection._inFlight) updateReflection._inFlight = new Map();
  const patchKey = `patch:${serverId}`;
  if (updateReflection._inFlight.has(patchKey)) return true;

  const task = (async () => {
    try {
      const headers = await buildAuthHeaders();
      const res = await fetch(`/api/reflections/${encodeURIComponent(serverId)}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        try {
          const { toast } = await import("sonner");
          toast.error(res.status === 401 ? "Sign in to sync your changes." : "Failed to sync changes.");
        } catch {
          /* ignore */
        }
        patchLocalReflection(serverId, {
          firebaseSyncStatus: res.status === 401 ? "local" : "failed",
        });
        return;
      }

      const payload = await res.json();
      const serverReflection = payload?.reflection;
      patchLocalReflection(serverId, {
        ...(serverReflection || {}),
        firebaseSyncStatus: serverReflection?.firebaseSyncStatus || "synced",
        qfSyncStatus: serverReflection?.qfSyncStatus || "syncing",
        updatedAt: serverReflection?.updatedAt || new Date().toISOString(),
      });
    } catch {
      patchLocalReflection(serverId, { firebaseSyncStatus: "failed" });
    }
  })();

  updateReflection._inFlight.set(patchKey, task);
  task.finally(() => updateReflection._inFlight.delete(patchKey));

  return true;
}

export function deleteReflection(id) {
  if (typeof window === "undefined") return false;

  const row = findReflection(id);
  if (!row) return false;

  const lookupKey = row.tempId || row.id;
  const serverId = getServerReflectionId(row);
  const removed = row;

  const list = getStoredReflections();
  const idx = findReflectionIndex(list, lookupKey);
  const next = idx === -1 ? list : list.filter((_, i) => i !== idx);
  persistReflections(next);

  if (!serverId) {
    reflectionLog("delete.local_only", { id: lookupKey });
    return true;
  }

  if (!deleteReflection._inFlight) deleteReflection._inFlight = new Map();
  const deleteKey = `delete:${serverId}`;
  if (deleteReflection._inFlight.has(deleteKey)) return true;

  const task = (async () => {
    try {
      const headers = await buildAuthHeaders();
      const res = await fetch(`/api/reflections/${encodeURIComponent(serverId)}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        try {
          const { toast } = await import("sonner");
          toast.error("Failed to delete remotely. Change will be retried.");
        } catch {
          /* ignore */
        }
        persistReflections([normalizeReflectionFields({ ...removed, syncStatus: "failed" }), ...getStoredReflections()]);
      }
    } catch {
      persistReflections([normalizeReflectionFields({ ...removed, syncStatus: "failed" }), ...getStoredReflections()]);
    }
  })();

  deleteReflection._inFlight.set(deleteKey, task);
  task.finally(() => deleteReflection._inFlight.delete(deleteKey));

  return true;
}

export function retryFailedReflectionSyncs() {
  if (typeof window === "undefined") return;
  const pending = getStoredReflections().filter(
    (r) => r.firebaseSyncStatus === "failed" || (r.firebaseSyncStatus === "syncing" && !getServerReflectionId(r)),
  );

  for (const row of pending.slice(0, 3)) {
    const serverId = getServerReflectionId(row);
    if (!serverId) {
      const key = `create:${row.tempId || row.id}`;
      if (saveReflection._inFlight?.has(key)) continue;
      saveReflection(row);
    } else if (row.firebaseSyncStatus === "failed") {
      updateReflection(serverId, {
        reflectionText: row.reflectionText,
        title: row.title,
        tags: row.tags,
      });
    }
  }
}
