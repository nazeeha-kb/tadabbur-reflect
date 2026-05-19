import admin from "../firebase/firebaseAdmin";
import getOrCreateAppUser from "./getOrCreateAppUser";
import { getSessionUser } from "@/lib/server/session";

export default async function resolveAuthUser(request?: Request) {
  // Try Quran Foundation session first
  try {
    const qfUser = await getSessionUser();
    if (qfUser && qfUser.id) {
      const mapped = await getOrCreateAppUser("qf", String(qfUser.id), { email: qfUser.email, name: qfUser.name });
      console.info(JSON.stringify({ event: "auth.resolve", provider: "qf", providerUserId: qfUser.id, appUserId: mapped.appUserId }));
      return { appUserId: mapped.appUserId, provider: "qf" as const };
    }
  } catch (e) {
    console.info(JSON.stringify({ event: "auth.resolve.error", provider: "qf", error: String(e) }));
  }

  // Next: try Firebase ID token in Authorization header
  try {
    if (!request) return null;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authHeader) return null;
    const m = authHeader.match(/^Bearer (.+)$/i);
    if (!m) return null;
    const idToken = m[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (decoded && decoded.uid) {
      const mapped = await getOrCreateAppUser("google", decoded.uid, { email: decoded.email, name: decoded.name });
      console.info(JSON.stringify({ event: "auth.resolve", provider: "google", providerUserId: decoded.uid, appUserId: mapped.appUserId }));
      return { appUserId: mapped.appUserId, provider: "google" as const };
    }
  } catch (e) {
    console.info(JSON.stringify({ event: "auth.resolve.error", provider: "google", error: String(e) }));
    return null;
  }

  return null;
}
