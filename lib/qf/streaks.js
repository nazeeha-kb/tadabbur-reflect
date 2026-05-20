import "server-only";

import { createQfApiClient } from "@/lib/api/qfApiClient";
import { getQfTokenBundle, persistQfTokens } from "@/lib/server/qfTokens";
import admin from "@/lib/firebase/firebaseAdmin";

const db = admin.firestore();

function streakLog(event, meta = {}) {
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

function normalizeQfStreak(data) {
  if (!data || typeof data !== "object") return null;

  const current =
    data.currentStreak ?? data.current_streak ?? data.streak ?? data.current ?? null;
  const longest =
    data.longestStreak ?? data.longest_streak ?? data.longest ?? null;

  if (current == null && longest == null) return null;

  return {
    currentStreak: Number(current) || 0,
    longestStreak: Number(longest) || Number(current) || 0,
    source: "qf",
  };
}

async function getFirebaseStreak(appUserId) {
  if (!appUserId) return null;
  try {
    const snap = await db.collection("streaks").doc(appUserId).get();
    if (!snap.exists) return { currentStreak: 0, longestStreak: 0, source: "firebase" };
    const data = snap.data();
    return {
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || data.currentStreak || 0,
      lastActiveDate: data.lastActiveDate || null,
      source: "firebase",
    };
  } catch (err) {
    streakLog("streak.firebase_error", { appUserId, message: String(err?.message || err) });
    return null;
  }
}

/**
 * Fetch streak from QF User API; fall back to Firestore streak doc.
 */
export async function getStreakWithFallback({ appUserId } = {}) {
  const client = await getQfClient();

  if (client) {
    try {
      const response = await client.fetch("/streaks");
      if (response.ok) {
        const json = await response.json();
        const normalized = normalizeQfStreak(json?.data ?? json);
        if (normalized) {
          streakLog("streak.fetch.qf", { appUserId, currentStreak: normalized.currentStreak });
          return normalized;
        }
      }
      const errorText = await response.text();
      streakLog("streak.fetch.qf_failed", {
        status: response.status,
        body: errorText
      });
    } catch (err) {
      streakLog("streak.fetch.qf_error", { appUserId, message: String(err?.message || err) });
    }
  }

  const firebase = await getFirebaseStreak(appUserId);
  if (firebase) {
    streakLog("streak.fetch.firebase_fallback", { appUserId, currentStreak: firebase.currentStreak });
  }
  return firebase;
}
