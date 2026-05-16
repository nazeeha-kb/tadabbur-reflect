import "server-only";

import { cookies } from "next/headers";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";
import { authLog } from "@/lib/server/authDebug";
import { clearQfTokenCookies, persistQfTokens, QF_USER_COOKIE } from "@/lib/server/qfTokens";

export const APP_SESSION_COOKIE = "app_session";
const APP_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export async function setAppSession(user, options = {}) {
  const cookieStore = await cookies();
  const token = signJwt({
    sub: user.id,
    email: user.email,
    name: user.name || "",
    provider: user.provider || "local",
    kind: user.kind || "user",
  });

  cookieStore.set(APP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: APP_SESSION_MAX_AGE_SEC,
  });

  if (options.qfTokens) {
    await persistQfTokens(options.qfTokens);
  } else if (options.qfAccessToken) {
    await persistQfTokens({ access_token: options.qfAccessToken, expires_in: options.qfExpiresIn });
  }

  authLog("session.created", {
    userId: user.id,
    provider: user.provider || "local",
    hasQfTokens: Boolean(options.qfTokens || options.qfAccessToken),
  });
}

export async function clearAppSession() {
  const cookieStore = await cookies();
  cookieStore.delete(APP_SESSION_COOKIE);
  await clearQfTokenCookies();
  authLog("session.cleared");
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value;
  if (!token) {
    authLog("session.validate", { valid: false, reason: "no_cookie" });
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    authLog("session.validate", { valid: false, reason: "invalid_or_expired_jwt" });
    return null;
  }

  authLog("session.validate", { valid: true, provider: payload.provider || "local" });
  return {
    id: payload.sub,
    email: payload.email || "",
    name: payload.name || "",
    provider: payload.provider || "local",
    kind: payload.kind || "user",
  };
}

export async function getQfUserToken() {
  const cookieStore = await cookies();
  return cookieStore.get(QF_USER_COOKIE)?.value || null;
}
