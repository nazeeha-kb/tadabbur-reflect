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
  const id = reflection.id || crypto?.randomUUID?.() || `local-${Date.now()}`;
  const entry = {
    ...reflection,
    id,
    searchQuery,
    emotion: reflection.emotion?.trim() || searchQuery || reflection.emotion,
    tags: normalizeTags(reflection.tags),
    syncStatus: "syncing",
  };

  const next = [entry, ...previous];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Try to sync to server in background. If user is guest or unauthenticated,
  // the server will return 401 — keep local copy.
  (async () => {
    try {
      // attach Firebase ID token if available
      let headers = { "Content-Type": "application/json" };
      try {
        const mod = await import("../firebase/firebaseClientAuth");
        const token = await mod.getFirebaseIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore
      }

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
        // show a toast for failures (lazy import to avoid server bundling issues)
        try {
          const { toast } = await import("sonner");
          if (res.status === 401) {
            toast.error("Sign in to sync reflections across devices.");
          } else {
            toast.error("Failed to sync reflection. It will retry in background.");
          }
        } catch {
          /* ignore toast failures */
        }
        // mark as local/failed but do not throw to avoid noisy console
        const list = getStoredReflections();
        const idx = list.findIndex((r) => r.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], syncStatus: res.status === 401 ? "local" : "failed" };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        return;
      }

      const payload = await res.json();
      const serverReflection = payload?.reflection || payload?.data?.reflection || null;

      // Replace local entry with server-side id and mark synced
      const list = getStoredReflections();
      const idx = list.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const updated = {
          ...list[idx],
          id: serverReflection?.id || list[idx].id,
          syncStatus: serverReflection?.syncStatus || "synced",
          qfNoteId: serverReflection?.qfNoteId ?? list[idx].qfNoteId,
          createdAt: serverReflection?.createdAt || list[idx].createdAt,
          updatedAt: serverReflection?.updatedAt || list[idx].updatedAt,
        };
        list[idx] = updated;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      // network or unexpected error — notify user and mark failed
      try {
        const { toast } = await import("sonner");
        toast.error("Failed to sync reflection. It will retry in background.");
      } catch {
        /* ignore */
      }
      const list = getStoredReflections();
      const idx = list.findIndex((r) => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], syncStatus: "failed" };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    }
  })();
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
    syncStatus: "syncing",
  };
  const next = [...list];
  next[idx] = nextEntry;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Patch server in background
  (async () => {
    try {
      let headers = { "Content-Type": "application/json" };
      try {
        const mod = await import("../firebase/firebaseClientAuth");
        const token = await mod.getFirebaseIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/reflections/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        try {
          const { toast } = await import("sonner");
          if (res.status === 401) {
            toast.error("Sign in to sync your changes.");
          } else {
            toast.error("Failed to sync changes. Will retry in background.");
          }
        } catch {}
        const list2 = getStoredReflections();
        const idx2 = list2.findIndex((r) => r.id === id);
        if (idx2 !== -1) {
          list2[idx2] = { ...list2[idx2], syncStatus: res.status === 401 ? "local" : "failed" };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list2));
        }
        return;
      }

      const payload = await res.json();
      const serverReflection = payload?.reflection || null;
      const list3 = getStoredReflections();
      const idx3 = list3.findIndex((r) => r.id === id);
      if (idx3 !== -1) {
        list3[idx3] = {
          ...list3[idx3],
          id: serverReflection?.id || list3[idx3].id,
          syncStatus: "synced",
          updatedAt: serverReflection?.updatedAt || list3[idx3].updatedAt,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list3));
      }
    } catch (e) {
      try {
        const { toast } = await import("sonner");
        toast.error("Failed to sync changes. Will retry in background.");
      } catch {}
      const list4 = getStoredReflections();
      const idx4 = list4.findIndex((r) => r.id === id);
      if (idx4 !== -1) {
        list4[idx4] = { ...list4[idx4], syncStatus: "failed" };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list4));
      }
    }
  })();

  return true;
}

export function deleteReflection(id) {
  if (typeof window === "undefined") return false;
  const list = getStoredReflections();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  const removed = list[idx];
  const next = list.filter((r) => r.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Attempt server delete in background. If unauthenticated, re-add locally.
  (async () => {
    try {
      let headers = {};
      try {
        const mod = await import("../firebase/firebaseClientAuth");
        const token = await mod.getFirebaseIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/reflections/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        try {
          const { toast } = await import("sonner");
          if (res.status === 401) {
            toast.error("Sign in to sync deletions.");
          } else {
            toast.error("Failed to delete remotely. Change will be retried.");
          }
        } catch {}
        const list2 = getStoredReflections();
        const entry = { ...removed, syncStatus: res.status === 401 ? "local" : "failed" };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...list2]));
      }
    } catch (e) {
      try {
        const { toast } = await import("sonner");
        toast.error("Failed to delete remotely. Change will be retried.");
      } catch {}
      const list3 = getStoredReflections();
      const entry = { ...removed, syncStatus: "failed" };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...list3]));
    }
  })();

  return true;
}
