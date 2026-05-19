import admin from "../firebase/firebaseAdmin";
import { TADABBUR_NOTE_SOURCE } from "@/lib/qf/notesSync";
import {
  syncCreateQfNote,
  syncDeleteQfNote,
  syncUpdateQfNote,
} from "@/lib/qf/notesSync";
import { getQfTokenBundle } from "@/lib/server/qfTokens";

const db = admin.firestore();

const DEFAULT_PAGE_SIZE = 10;

function utcYmdFromTimestamp(ts) {
  const d = ts instanceof admin.firestore.Timestamp ? ts.toDate() : new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function serializeReflection(doc) {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate?.()
    ? data.createdAt.toDate().toISOString()
    : data.createdAt || null;
  const updatedAt = data.updatedAt?.toDate?.()
    ? data.updatedAt.toDate().toISOString()
    : data.updatedAt || null;

  return {
    id: doc.id,
    ...data,
    reflectionText: data.reflectionText || data.reflection || "",
    createdAt,
    updatedAt,
  };
}

export function encodeReflectionCursor(doc) {
  const data = doc.data();
  const createdAt = data.createdAt;
  if (!createdAt) return null;
  const payload = {
    id: doc.id,
    createdAtMs: createdAt.toMillis(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeReflectionCursor(cursor) {
  if (!cursor) return null;
  try {
    const json = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!json?.id || !json?.createdAtMs) return null;
    return json;
  } catch {
    return null;
  }
}

function buildReflectionPayload(appUserId, fields) {
  const text = fields.text ?? fields.reflectionText ?? fields.reflection ?? "";
  return {
    appUserId,
    source: TADABBUR_NOTE_SOURCE,
    verseKey: fields.verseKey || "",
    reflection: text,
    reflectionText: text,
    emotion: fields.emotion || "",
    title: fields.title || null,
    tags: fields.tags || [],
    tafseer: fields.tafseer || null,
    ayahs: fields.ayahs || null,
    searchQuery: fields.searchQuery || fields.emotion || "",
    firebaseSyncStatus: "synced",
    qfSyncStatus: "syncing",
    syncStatus: "syncing",
    qfNoteId: fields.qfNoteId || null,
  };
}

async function runQfSyncCreate(ref, payload) {
  const now = admin.firestore.Timestamp.now();
  const current = await ref.get();
  if (current.exists && current.data()?.qfNoteId) {
    await ref.update({
      firebaseSyncStatus: "synced",
      qfSyncStatus: "synced",
      syncStatus: "synced",
      updatedAt: now,
    });
    return { qfNoteId: current.data().qfNoteId };
  }

  const { accessToken } = await getQfTokenBundle();

  if (!accessToken) {
    await ref.update({
      firebaseSyncStatus: "synced",
      qfSyncStatus: "skipped",
      syncStatus: "synced",
      updatedAt: now,
    });
    console.info(JSON.stringify({ event: "qf.sync.skip", reflectionId: ref.id, reason: "no_tokens" }));
    return { qfNoteId: null };
  }

  const qfNoteId = await syncCreateQfNote({
    reflectionId: ref.id,
    verseKey: payload.verseKey,
    body: payload.reflection,
    title: payload.title,
    tags: payload.tags,
    emotion: payload.emotion,
  });

  const qfSyncStatus = qfNoteId ? "synced" : "failed";
  await ref.update({
    qfNoteId: qfNoteId || null,
    firebaseSyncStatus: "synced",
    qfSyncStatus,
    syncStatus: "synced",
    updatedAt: now,
  });

  console.info(
    JSON.stringify({
      event: qfNoteId ? "qf.sync.created" : "qf.sync.create_failed",
      reflectionId: ref.id,
      qfNoteId,
    }),
  );

  return { qfNoteId };
}

export async function createReflection(appUserId, fields = {}) {
  const now = admin.firestore.Timestamp.now();
  const payload = {
    ...buildReflectionPayload(appUserId, fields),
    createdAt: now,
  };

  const ref = await db.collection("reflections").add(payload);

  void updateStreakOnReflection(appUserId, now).catch(() => {});
  void runQfSyncCreate(ref, payload).catch(() => {});

  const doc = await ref.get();
  return serializeReflection(doc);
}

export async function getUserReflectionsPaginated(
  appUserId,
  { limit = DEFAULT_PAGE_SIZE, cursor = null } = {},
) {
  const pageSize = Math.min(Math.max(Number(limit) || DEFAULT_PAGE_SIZE, 1), 50);

  let q = db
    .collection("reflections")
    .where("appUserId", "==", appUserId)
    .where("source", "==", TADABBUR_NOTE_SOURCE)
    .orderBy("createdAt", "desc")
    .orderBy(admin.firestore.FieldPath.documentId(), "desc")
    .limit(pageSize + 1);

  const decoded = decodeReflectionCursor(cursor);
  if (decoded) {
    q = q.startAfter(
      admin.firestore.Timestamp.fromMillis(decoded.createdAtMs),
      decoded.id,
    );
  }

  const snap = await q.get();
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const reflections = pageDocs.map(serializeReflection);
  const lastDoc = pageDocs[pageDocs.length - 1] || null;
  const nextCursor = hasMore && lastDoc ? encodeReflectionCursor(lastDoc) : null;

  console.info(
    JSON.stringify({
      event: "pagination.reflections",
      appUserId,
      count: reflections.length,
      hasMore,
    }),
  );

  return { reflections, nextCursor, hasMore };
}

/** @deprecated Use getUserReflectionsPaginated */
export async function getUserReflections(appUserId, { limit = 100 } = {}) {
  const { reflections } = await getUserReflectionsPaginated(appUserId, { limit });
  return reflections;
}

export async function updateReflection(id, appUserId, updates = {}) {
  const ref = db.collection("reflections").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("not_found");
  if (doc.data().appUserId !== appUserId) throw new Error("unauthorized");

  const existing = doc.data();
  const mergedText =
    updates.reflectionText ?? updates.reflection ?? updates.text ?? existing.reflection ?? "";

  const now = admin.firestore.Timestamp.now();
  const patch = {
    ...updates,
    reflection: mergedText,
    reflectionText: mergedText,
    updatedAt: now,
    firebaseSyncStatus: "synced",
    qfSyncStatus: "syncing",
    syncStatus: "syncing",
  };

  await ref.update(patch);

  const qfNoteId = existing.qfNoteId;
  void (async () => {
    let qfSyncStatus = "synced";
    if (qfNoteId) {
      const ok = await syncUpdateQfNote({
        qfNoteId,
        reflectionId: id,
        verseKey: patch.verseKey ?? existing.verseKey,
        body: mergedText,
        title: patch.title ?? existing.title,
        tags: patch.tags ?? existing.tags,
        emotion: patch.emotion ?? existing.emotion,
      });
      qfSyncStatus = ok ? "synced" : "failed";
    } else {
      const created = await syncCreateQfNote({
        reflectionId: id,
        verseKey: existing.verseKey,
        body: mergedText,
        title: patch.title ?? existing.title,
        tags: patch.tags ?? existing.tags,
        emotion: patch.emotion ?? existing.emotion,
      });
      if (created) {
        await ref.update({
          qfNoteId: created,
          firebaseSyncStatus: "synced",
          qfSyncStatus: "synced",
          syncStatus: "synced",
          updatedAt: admin.firestore.Timestamp.now(),
        });
        return;
      }
      qfSyncStatus = "failed";
    }
    await ref.update({
      firebaseSyncStatus: "synced",
      qfSyncStatus,
      syncStatus: "synced",
      updatedAt: admin.firestore.Timestamp.now(),
    });
  })().catch(() => {});

  const updated = await ref.get();
  return serializeReflection(updated);
}

export async function deleteReflection(id, appUserId) {
  const ref = db.collection("reflections").doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("not_found");
  if (doc.data().appUserId !== appUserId) throw new Error("unauthorized");

  const qfNoteId = doc.data().qfNoteId;
  await ref.delete();

  if (qfNoteId) {
    void syncDeleteQfNote(qfNoteId).catch(() => {});
  }

  return { id };
}

export async function updateStreakOnReflection(appUserId, timestamp) {
  const today = utcYmdFromTimestamp(timestamp || admin.firestore.Timestamp.now());
  const streakRef = db.collection("streaks").doc(appUserId);
  const snap = await streakRef.get();

  if (!snap.exists) {
    await streakRef.set({ appUserId, currentStreak: 1, longestStreak: 1, lastActiveDate: today });
    return;
  }

  const data = snap.data();
  const last = data.lastActiveDate || null;
  if (last === today) return;

  const lastDate = new Date(`${last}T00:00:00Z`);
  const curDate = new Date(`${today}T00:00:00Z`);
  const diffDays = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24));

  let currentStreak = data.currentStreak || 0;
  let longest = data.longestStreak || currentStreak;

  if (diffDays === 1) {
    currentStreak += 1;
    longest = Math.max(longest, currentStreak);
  } else if (diffDays > 1 || !last) {
    currentStreak = 1;
    longest = Math.max(longest, currentStreak);
  }

  await streakRef.set({ appUserId, currentStreak, longestStreak: longest, lastActiveDate: today }, { merge: true });
}
