import "server-only";

import { createQfApiClient } from "@/lib/api/qfApiClient";
import { getQfTokenBundle, persistQfTokens } from "@/lib/server/qfTokens";

export const TADABBUR_NOTE_SOURCE = "tadabbur-app";

function qfLog(event, meta = {}) {
  // keep logs structured and minimal
  if (event.startsWith("qf.sync.")) {
    console.info(JSON.stringify({ event, ...meta }));
  }
}

async function getQfClient() {
  const { accessToken, refreshToken } = await getQfTokenBundle();
  if (!accessToken) return null;

  return createQfApiClient({
    accessToken,
    refreshToken,
    onTokensUpdate: async (newTokens) => {
      await persistQfTokens(newTokens);
    },
    isConfidential: true,
  });
}

function buildNotePayload({ reflectionId, verseKey, body, title, tags, emotion }) {
  const noteBody = [title, body].filter(Boolean).join("\n\n").trim() || body || "";
  const ranges = verseKey?.includes(":") ? [verseKey] : [];

  return {
    body: noteBody,
    source: TADABBUR_NOTE_SOURCE,
    ranges,
    attachedEntities: [
      {
        entityId: reflectionId,
        entityType: "reflection",
        entityMetadata: {
          source: TADABBUR_NOTE_SOURCE,
          tags: tags || [],
          emotion: emotion || "",
        },
      },
    ],
  };
}

/**
 * Create a QF note for a Tadabbur reflection. Returns note id or null.
 */
export async function syncCreateQfNote({ reflectionId, verseKey, body, title, tags, emotion }) {
  const client = await getQfClient();
  if (!client) {
    qfLog("qf.sync.skip", { reason: "no_qf_tokens", reflectionId });
    return null;
  }
  // Deduplicate concurrent create requests per reflectionId
  if (!syncCreateQfNote._inFlight) syncCreateQfNote._inFlight = new Map();
  const key = `create:${reflectionId}`;
  if (syncCreateQfNote._inFlight.has(key)) {
    return syncCreateQfNote._inFlight.get(key);
  }

  const task = (async () => {
    const payload = buildNotePayload({ reflectionId, verseKey, body, title, tags, emotion });
    let attempt = 0;
    const maxAttempts = 2;
    const baseDelay = 250;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const response = await client.fetch("/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 403) {
            qfLog("qf.sync.create_forbidden", { reflectionId, status: response.status });
            return null;
          }
          qfLog("qf.sync.create_failed", { reflectionId, status: response.status, attempt });
          if (response.status >= 500 && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, baseDelay * attempt));
            continue;
          }
          return null;
        }

        const json = await response.json();
        const noteId = json?.data?.id || json?.id || null;
        qfLog("qf.sync.created", { reflectionId, qfNoteId: noteId });
        return noteId;
      } catch (err) {
        qfLog("qf.sync.create_error", { reflectionId, message: String(err?.message || err), attempt });
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, baseDelay * attempt));
          continue;
        }
        return null;
      }
    }
    return null;
  })();

  syncCreateQfNote._inFlight.set(key, task);
  try {
    const res = await task;
    return res;
  } finally {
    syncCreateQfNote._inFlight.delete(key);
  }
}

export async function syncUpdateQfNote({ qfNoteId, reflectionId, verseKey, body, title, tags, emotion }) {
  if (!qfNoteId) return false;
  const client = await getQfClient();
  if (!client) return false;
  // Deduplicate concurrent updates per qfNoteId
  if (!syncUpdateQfNote._inFlight) syncUpdateQfNote._inFlight = new Map();
  const key = `update:${qfNoteId}`;
  if (syncUpdateQfNote._inFlight.has(key)) return syncUpdateQfNote._inFlight.get(key);

  const task = (async () => {
    const payload = buildNotePayload({ reflectionId, verseKey, body, title, tags, emotion });
    let attempt = 0;
    const maxAttempts = 2;
    const baseDelay = 200;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const response = await client.fetch(`/notes/${encodeURIComponent(qfNoteId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 403) {
            qfLog("qf.sync.update_forbidden", { reflectionId, qfNoteId, status: response.status });
            return false;
          }
          qfLog("qf.sync.update_failed", { reflectionId, qfNoteId, status: response.status, attempt });
          if (response.status >= 500 && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, baseDelay * attempt));
            continue;
          }
          return false;
        }

        qfLog("qf.sync.updated", { reflectionId, qfNoteId });
        return true;
      } catch (err) {
        qfLog("qf.sync.update_error", { reflectionId, qfNoteId, message: String(err?.message || err), attempt });
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, baseDelay * attempt));
          continue;
        }
        return false;
      }
    }
    return false;
  })();

  syncUpdateQfNote._inFlight.set(key, task);
  try {
    const res = await task;
    return res;
  } finally {
    syncUpdateQfNote._inFlight.delete(key);
  }
}

export async function syncDeleteQfNote(qfNoteId) {
  if (!qfNoteId) return true;
  const client = await getQfClient();
  if (!client) return false;
  // Deduplicate deletes per qfNoteId
  if (!syncDeleteQfNote._inFlight) syncDeleteQfNote._inFlight = new Map();
  const key = `delete:${qfNoteId}`;
  if (syncDeleteQfNote._inFlight.has(key)) return syncDeleteQfNote._inFlight.get(key);

  const task = (async () => {
    try {
      const response = await client.fetch(`/notes/${encodeURIComponent(qfNoteId)}`, {
        method: "DELETE",
      });

      if (response.status === 404) return true;

      if (!response.ok) {
        qfLog("qf.sync.delete_failed", { qfNoteId, status: response.status });
        return false;
      }

      qfLog("qf.sync.deleted", { qfNoteId });
      return true;
    } catch (err) {
      qfLog("qf.sync.delete_error", { qfNoteId, message: String(err?.message || err) });
      return false;
    }
  })();

  syncDeleteQfNote._inFlight.set(key, task);
  try {
    const res = await task;
    return res;
  } finally {
    syncDeleteQfNote._inFlight.delete(key);
  }
}
