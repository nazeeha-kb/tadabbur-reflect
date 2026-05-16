import "server-only";

import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/auth/qfPkceAuth";
import { getQfOAuthConfig } from "@/lib/api/qfOAuthConfig";
import { authLog } from "@/lib/server/authDebug";

export const QF_ACCESS_COOKIE = "qf_access_token";
export const QF_REFRESH_COOKIE = "qf_refresh_token";
export const QF_USER_COOKIE = "qf_user_token";

const REFRESH_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function accessTokenMaxAge(expiresIn) {
  const n = Number(expiresIn);
  if (Number.isFinite(n) && n > 60) return Math.min(Math.floor(n), 60 * 60 * 24 * 7);
  return 60 * 60;
}

/** Persist QF access + refresh tokens in httpOnly cookies (keeps user + access cookies in sync). */
export async function persistQfTokens(tokens) {
  const cookieStore = await cookies();
  const opts = cookieBaseOptions();
  const accessMaxAge = accessTokenMaxAge(tokens?.expires_in);

  if (tokens?.access_token) {
    cookieStore.set(QF_ACCESS_COOKIE, tokens.access_token, { ...opts, maxAge: accessMaxAge });
    cookieStore.set(QF_USER_COOKIE, tokens.access_token, { ...opts, maxAge: accessMaxAge });
  }
  if (tokens?.refresh_token) {
    cookieStore.set(QF_REFRESH_COOKIE, tokens.refresh_token, { ...opts, maxAge: REFRESH_MAX_AGE_SEC });
  }

  authLog("tokens.persisted", {
    hasAccess: Boolean(tokens?.access_token),
    hasRefresh: Boolean(tokens?.refresh_token),
    accessMaxAge,
  });
}

export async function getQfTokenBundle() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get(QF_USER_COOKIE)?.value || cookieStore.get(QF_ACCESS_COOKIE)?.value || null;
  const refreshToken = cookieStore.get(QF_REFRESH_COOKIE)?.value || null;
  return { accessToken, refreshToken };
}

export async function clearQfTokenCookies() {
  const cookieStore = await cookies();
  for (const name of [QF_ACCESS_COOKIE, QF_REFRESH_COOKIE, QF_USER_COOKIE]) {
    cookieStore.delete(name);
  }
  authLog("tokens.cleared");
}

async function validateQfAccessToken(accessToken) {
  const { apiBaseUrl, clientId } = getQfOAuthConfig();
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/v1/me`, {
    headers: {
      "x-auth-token": accessToken,
      "x-client-id": clientId,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  authLog("tokens.validate", { status: response.status });
  return response.ok;
}

async function refreshAndPersist(refreshToken) {
  authLog("tokens.refresh_start");
  const refreshed = await refreshAccessToken({ refreshToken });
  await persistQfTokens(refreshed);
  authLog("tokens.refresh_ok", { hasAccess: Boolean(refreshed?.access_token) });
  return refreshed;
}

/**
 * Best-effort QF token refresh. Never throws; does not clear the app session.
 * The app session JWT is the source of truth for logged-in state.
 */
export async function maintainQfTokens() {
  const { accessToken, refreshToken } = await getQfTokenBundle();

  if (!accessToken && !refreshToken) {
    authLog("tokens.maintain_skip", { reason: "no_qf_cookies" });
    return { ok: false, reason: "no_tokens" };
  }

  if (accessToken) {
    try {
      const valid = await validateQfAccessToken(accessToken);
      if (valid) {
        authLog("tokens.maintain_ok", { via: "access_token" });
        return { ok: true };
      }
    } catch (error) {
      authLog("tokens.maintain_validate_error", { message: String(error?.message || error) });
    }
  }

  if (!refreshToken) {
    authLog("tokens.maintain_stale", { reason: "no_refresh_token" });
    return { ok: false, reason: "stale_no_refresh" };
  }

  try {
    await refreshAndPersist(refreshToken);
    return { ok: true, refreshed: true };
  } catch (error) {
    authLog("tokens.maintain_refresh_failed", { message: String(error?.message || error) });
    return { ok: false, reason: "refresh_failed" };
  }
}
