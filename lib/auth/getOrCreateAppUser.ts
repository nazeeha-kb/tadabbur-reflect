import admin from "../firebase/firebaseAdmin";
import { randomUUID } from "crypto";

type Provider = "google" | "qf";

export default async function getOrCreateAppUser(
  provider: Provider,
  providerUserId: string,
  userProfile: { email?: string; name?: string } = {},
) {
  const db = admin.firestore();
  // lookup by provider key
  const q = db.collection("users").where(`providers.${provider}`, "==", providerUserId).limit(1);
  const snap = await q.get();
  if (!snap.empty) {
    const doc = snap.docs[0];
    // update lastLoginAt
    await doc.ref.update({ lastLoginAt: admin.firestore.Timestamp.now() });
    return { appUserId: doc.id, ...doc.data() };
  }

  // not found — create new user doc using appUserId as doc id
  const appUserId = randomUUID();
  const now = admin.firestore.Timestamp.now();
  const userDoc = {
    appUserId,
    providers: { [provider]: providerUserId },
    email: userProfile.email || null,
    name: userProfile.name || null,
    createdAt: now,
    lastLoginAt: now,
  };

  await db.collection("users").doc(appUserId).set(userDoc);
  return { appUserId, ...userDoc };
}
