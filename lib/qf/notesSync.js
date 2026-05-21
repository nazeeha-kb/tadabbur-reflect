import "server-only";

import { createQfApiClient } from "@/lib/api/qfApiClient";
import { getQfTokenBundle, persistQfTokens } from "@/lib/server/qfTokens";

export const TADABBUR_NOTE_SOURCE = "tadabbur-app";

function qfLog(event, meta = {}) {
  if (event.startsWith("qf.sync.") || event.startsWith("qf.notes.")) {
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

/**
 * Keep payload MINIMAL until API is confirmed working
 * Then you can safely re-add ranges / entities
 */
function buildNotePayload({ body, title, verseKey }) {
  return {
    body: [title, body].filter(Boolean).join("\n\n").trim(),
    ranges: verseKey ? [`${verseKey}-${verseKey}`] : [],
    // source: TADABBUR_NOTE_SOURCE,
  };
}

/**
 * CREATE NOTE
 */
export async function syncCreateQfNote({
  reflectionId,
  verseKey,
  body,
  title,
}) {
  const client = await getQfClient();
  if (!client) {
    qfLog("qf.sync.skip", { reason: "no_qf_tokens", reflectionId });
    return null;
  }

  if (!syncCreateQfNote._inFlight) syncCreateQfNote._inFlight = new Map();
  const key = `create:${reflectionId}`;

  if (syncCreateQfNote._inFlight.has(key)) {
    return syncCreateQfNote._inFlight.get(key);
  }

  const task = (async () => {
    const payload = buildNotePayload({ body, title, verseKey });

    console.log("QF NOTES REQUEST:", JSON.stringify(payload, null, 2));

    try {
      const response = await client.fetch("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }

      if (!response.ok) {
        qfLog("qf.notes.create_failed", {
          reflectionId,
          status: response.status,
          error: parsed,
        });

        console.error("QF CREATE FAILED:", parsed);
        return null;
      }

      const noteId = parsed?.data?.id || parsed?.id || null;

      if (noteId) {
        try {
          await client.fetch("/activity-days", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "QURAN",
              seconds: 5,
              ranges: verseKey ? [`${verseKey}-${verseKey}`] : [],
              mushafId: 4,
              date: new Date().toISOString().slice(0, 10),
            }),
          });
        } catch (err) {
          console.error("activity-day failed", err);
        }
      }


      qfLog("qf.sync.created", {
        reflectionId,
        qfNoteId: noteId,
      });

      return noteId;
    } catch (err) {
      qfLog("qf.sync.create_error", {
        reflectionId,
        message: String(err?.message || err),
      });

      return null;
    }
  })();

  syncCreateQfNote._inFlight.set(key, task);

  try {
    return await task;
  } finally {
    syncCreateQfNote._inFlight.delete(key);
  }
}

/**
 * UPDATE NOTE
 */
export async function syncUpdateQfNote({
  qfNoteId,
  reflectionId,
  verseKey,
  body,
  title,
}) {
  if (!qfNoteId) return false;

  const client = await getQfClient();
  if (!client) return false;

  const key = `update:${qfNoteId}`;
  if (!syncUpdateQfNote._inFlight) syncUpdateQfNote._inFlight = new Map();

  if (syncUpdateQfNote._inFlight.has(key)) {
    return syncUpdateQfNote._inFlight.get(key);
  }

  const task = (async () => {
    const payload = buildNotePayload({ body, title, verseKey });

    try {
      const response = await client.fetch(
        `/notes/${encodeURIComponent(qfNoteId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const raw = await response.text();

      if (!response.ok) {
        qfLog("qf.notes.update_failed", {
          reflectionId,
          qfNoteId,
          status: response.status,
          body: raw,
        });

        console.error("QF UPDATE FAILED:", raw);
        return false;
      }

      qfLog("qf.sync.updated", { reflectionId, qfNoteId });
      return true;
    } catch (err) {
      qfLog("qf.sync.update_error", {
        reflectionId,
        qfNoteId,
        message: String(err?.message || err),
      });

      return false;
    }
  })();

  syncUpdateQfNote._inFlight.set(key, task);

  try {
    return await task;
  } finally {
    syncUpdateQfNote._inFlight.delete(key);
  }
}

/**
 * DELETE NOTE
 */
export async function syncDeleteQfNote(qfNoteId) {
  if (!qfNoteId) return true;

  const client = await getQfClient();
  if (!client) return false;

  const key = `delete:${qfNoteId}`;
  if (!syncDeleteQfNote._inFlight) syncDeleteQfNote._inFlight = new Map();

  if (syncDeleteQfNote._inFlight.has(key)) {
    return syncDeleteQfNote._inFlight.get(key);
  }

  const task = (async () => {
    try {
      const response = await client.fetch(
        `/notes/${encodeURIComponent(qfNoteId)}`,
        { method: "DELETE" }
      );

      const raw = await response.text();

      if (!response.ok && response.status !== 404) {
        qfLog("qf.sync.delete_failed", {
          qfNoteId,
          status: response.status,
          body: raw,
        });

        return false;
      }

      qfLog("qf.sync.deleted", { qfNoteId });
      return true;
    } catch (err) {
      qfLog("qf.sync.delete_error", {
        qfNoteId,
        message: String(err?.message || err),
      });

      return false;
    }
  })();

  syncDeleteQfNote._inFlight.set(key, task);

  try {
    return await task;
  } finally {
    syncDeleteQfNote._inFlight.delete(key);
  }
}