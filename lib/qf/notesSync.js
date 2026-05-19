import "server-only";

import { createQfApiClient } from "@/lib/api/qfApiClient";
import { getQfTokenBundle, persistQfTokens } from "@/lib/server/qfTokens";

export const TADABBUR_NOTE_SOURCE = "tadabbur-app";

function qfLog(event, meta = {}) {
  console.info(JSON.stringify({ event, ...meta }));
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

  try {
    const payload = buildNotePayload({ reflectionId, verseKey, body, title, tags, emotion });
    const response = await client.fetch("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      qfLog("qf.sync.create_failed", { reflectionId, status: response.status });
      return null;
    }

    const json = await response.json();
    const noteId = json?.data?.id || json?.id || null;
    qfLog("qf.sync.created", { reflectionId, qfNoteId: noteId });
    return noteId;
  } catch (err) {
    qfLog("qf.sync.create_error", { reflectionId, message: String(err?.message || err) });
    return null;
  }
}

export async function syncUpdateQfNote({ qfNoteId, reflectionId, verseKey, body, title, tags, emotion }) {
  if (!qfNoteId) return false;
  const client = await getQfClient();
  if (!client) return false;

  try {
    const payload = buildNotePayload({ reflectionId, verseKey, body, title, tags, emotion });
    const response = await client.fetch(`/notes/${encodeURIComponent(qfNoteId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      qfLog("qf.sync.update_failed", { reflectionId, qfNoteId, status: response.status });
      return false;
    }

    qfLog("qf.sync.updated", { reflectionId, qfNoteId });
    return true;
  } catch (err) {
    qfLog("qf.sync.update_error", { reflectionId, qfNoteId, message: String(err?.message || err) });
    return false;
  }
}

export async function syncDeleteQfNote(qfNoteId) {
  if (!qfNoteId) return true;
  const client = await getQfClient();
  if (!client) return false;

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
}
