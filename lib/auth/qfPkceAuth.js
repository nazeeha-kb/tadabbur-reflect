export const runtime = "nodejs";

import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getQfOAuthConfig } from "@/lib/api/qfOAuthConfig";
import { formatOAuthDebugHint, isQuranFoundationApiDebugEnabled } from "@/lib/api/qfApiDebug";
import { authLog } from "@/lib/server/authDebug";
import { clearQfTokenCookies, persistQfTokens } from "@/lib/server/qfTokens";

/** httpOnly cookie holding signed PKCE + OIDC session (never expose to browser JS) */
const PKCE_COOKIE_NAME = "qf_oauth_pkce";
const PKCE_COOKIE_MAX_AGE_SEC = 600;

/** Registered callback URL — must match authorize + token exchange exactly. */
export function resolveOAuthRedirectUri(requestUrl) {
  const fromEnv = process.env.QF_REDIRECT_URI?.trim() || process.env.QF_OAUTH_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (requestUrl) return `${new URL(requestUrl).origin}/api/auth/callback`;
  return "";
}

export function sessionUserFromIdTokenClaims(claims) {
  const name =
    claims.name ||
    [claims.first_name, claims.last_name].filter(Boolean).join(" ") ||
    claims.preferred_username ||
    "";
  return {
    id: claims.sub,
    email: claims.email || "",
    name,
    provider: "quran-foundation",
  };
}

export async function fetchQfUserProfile(accessToken) {
  const { apiBaseUrl, clientId } = getQfOAuthConfig();
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/auth/v1/me`, {
    headers: {
      "x-auth-token": accessToken,
      "x-client-id": clientId,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  const data = await response.json();
  const profile = data?.data ?? data?.user ?? data;
  const id = profile?.id || profile?.sub;
  if (!id) throw new Error("invalid_id_token_sub");
  const name =
    profile?.name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.username ||
    "";
  return {
    id: String(id),
    email: profile?.email || "",
    name,
    provider: "quran-foundation",
  };
}

/**
 * Confidential client: `client_secret_basic` for token exchange.
 * Public client (`token_endpoint_auth_method=none`): omit secret; PKCE still required.
 */

function getCookieSigningKey() {
  const key = process.env.QF_OAUTH_COOKIE_SECRET?.trim() || process.env.QF_CLIENT_SECRET?.trim();
  if (!key) {
    throw new Error("Set QF_OAUTH_COOKIE_SECRET (recommended) or QF_CLIENT_SECRET for PKCE session signing.");
  }
  return key;
}

function base64UrlEncodeBuffer(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** RFC 7636: 43–128 char verifier from unreserved set; high-entropy random. */
function generateCodeVerifier() {
  return base64UrlEncodeBuffer(randomBytes(32));
}

/** S256: BASE64URL(SHA256(ASCII/UTF-8 bytes of code_verifier)) */
function codeChallengeS256(codeVerifier) {
  const digest = createHash("sha256").update(codeVerifier, "utf8").digest();
  return base64UrlEncodeBuffer(digest);
}

function generateOpaqueValue() {
  return base64UrlEncodeBuffer(randomBytes(16));
}

function sealSessionPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", getCookieSigningKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unsealSessionPayload(sealed) {
  const idx = sealed.lastIndexOf(".");
  if (idx <= 0) {
    throw new Error("Invalid OAuth session");
  }
  const body = sealed.slice(0, idx);
  const sig = sealed.slice(idx + 1);
  const expected = createHmac("sha256", getCookieSigningKey()).update(body).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid OAuth session");
  }
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
}

/**
 * Build Authorization Code + PKCE authorize URL and persist verifier server-side (httpOnly cookie).
 * Does not return `code_verifier` to callers or the browser.
 *
 * @param {{ redirectUri: string, scopes?: string[] }} args
 * @returns {Promise<{ url: string, state: string, nonce: string }>}
 */
export async function buildAuthorizationUrl({ redirectUri, scopes }) {
  const { authBaseUrl, clientId } = getQfOAuthConfig();

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeS256(codeVerifier);
  const state = generateOpaqueValue();
  const nonce = generateOpaqueValue();

  const scopeList =
    scopes && scopes.length > 0 ? scopes : ["openid", "offline_access", "user", "collection"];
  const scope = scopeList.join(" ");

  const now = Date.now();
  const session = {
    state,
    nonce,
    codeVerifier,
    redirectUri,
    exp: now + PKCE_COOKIE_MAX_AGE_SEC * 1000,
  };

  const sealed = sealSessionPayload(session);
  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PKCE_COOKIE_MAX_AGE_SEC,
    path: "/",
  });

  const auth = authBaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const url = `${auth}/oauth2/auth?${params.toString()}`;
  return { url, state, nonce };
}

function parseJwtPayload(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length < 2) throw new Error("Invalid id_token format");
  const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(payloadRaw);
}

function audienceMatches(aud, clientId) {
  if (!aud) return true;
  if (Array.isArray(aud)) return aud.includes(clientId);
  return aud === clientId;
}

function issuerMatches(iss, authBaseUrl) {
  if (!iss) return true;
  const normalizedIss = String(iss).replace(/\/$/, "");
  const normalizedAuth = authBaseUrl.replace(/\/$/, "");
  if (normalizedIss === normalizedAuth) return true;
  try {
    // QF id_tokens may use a canonical issuer distinct from the auth host (e.g. oauth2.quran.com).
    if (/quran\.(foundation|com)$/i.test(new URL(normalizedIss).hostname)) return true;
  } catch {
    // ignore malformed iss
  }
  return false;
}

export function validateIdTokenClaims({ idToken, expectedNonce }) {
  if (!idToken) throw new Error("missing_id_token");

  const claims = parseJwtPayload(idToken);
  const now = Math.floor(Date.now() / 1000);
  const { clientId, authBaseUrl } = getQfOAuthConfig();

  if (!claims.sub) throw new Error("invalid_id_token_sub");
  if (expectedNonce && claims.nonce !== expectedNonce) throw new Error("invalid_nonce");
  if (typeof claims.exp === "number" && claims.exp <= now) throw new Error("expired_session");
  if (!audienceMatches(claims.aud, clientId)) throw new Error("invalid_id_token_audience");
  if (!issuerMatches(claims.iss, authBaseUrl)) throw new Error("invalid_id_token_issuer");

  return claims;
}

/**
 * Validates `state` against the httpOnly cookie, returns session fields, and clears the cookie.
 * Use before token exchange. Never log returned `codeVerifier`.
 */
export async function validateStateAndConsumePkceSession(expectedState) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PKCE_COOKIE_NAME)?.value;
  cookieStore.delete(PKCE_COOKIE_NAME);

  if (!raw) {
    throw new Error("Missing OAuth session");
  }

  const session = unsealSessionPayload(raw);
  if (typeof session.exp === "number" && Date.now() > session.exp) {
    throw new Error("OAuth session expired");
  }
  if (!session.state || session.state !== expectedState) {
    throw new Error("Invalid OAuth state");
  }

  return {
    codeVerifier: session.codeVerifier,
    nonce: session.nonce,
    redirectUri: session.redirectUri,
  };
}

/**
 * Authorization Code exchange (Step 3). PKCE: include `code_verifier` in body.
 * Does not log tokens or secrets.
 */
export async function exchangeAuthorizationCode({ code, redirectUri, codeVerifier, isConfidential }) {
  const { authBaseUrl, clientId, clientSecret } = getQfOAuthConfig();
  const tokenUrl = `${authBaseUrl.replace(/\/$/, "")}/oauth2/token`;

  // Default to confidential if clientSecret is present, else public
  const confidential = isConfidential !== undefined ? isConfidential : !!clientSecret;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (confidential && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  } else {
    body.set("client_id", clientId);
  }

  const response = await fetch(tokenUrl, { method: "POST", headers, body });

  if (!response.ok) {
    const detail = await response.text();
    authLog("exchange.failed", { status: response.status });
    if (isQuranFoundationApiDebugEnabled()) {
      throw new Error(`Failed to exchange authorization code for tokens${formatOAuthDebugHint(response.status, detail)}`);
    }
    throw new Error("Failed to exchange authorization code for tokens");
  }

  const data = await response.json();
  authLog("exchange.ok", { hasRefresh: Boolean(data.refresh_token), expiresIn: data.expires_in });

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    id_token: data.id_token,
    expires_in: data.expires_in,
    scope: data.scope,
    token_type: data.token_type,
  };
}

/**
 * Refresh access token using refresh_token.
 * Does not log tokens or secrets.
 */
export async function refreshAccessToken({ refreshToken, isConfidential }) {
  const { authBaseUrl, clientId, clientSecret } = getQfOAuthConfig();
  const tokenUrl = `${authBaseUrl.replace(/\/$/, "")}/oauth2/token`;

  // Default to confidential if clientSecret is present, else public
  const confidential = isConfidential !== undefined ? isConfidential : !!clientSecret;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (confidential && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  } else {
    body.set("client_id", clientId);
  }

  const response = await fetch(tokenUrl, { method: "POST", headers, body });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    id_token: data.id_token,
    expires_in: data.expires_in,
    scope: data.scope,
    token_type: data.token_type,
  };
}

/** @deprecated Use getQfTokenBundle from @/lib/server/qfTokens */
export async function getStoredTokens() {
  const { getQfTokenBundle } = await import("@/lib/server/qfTokens");
  return getQfTokenBundle();
}

export async function clearStoredTokens() {
  await clearQfTokenCookies();
}

/** @deprecated Use persistQfTokens from @/lib/server/qfTokens */
export async function updateStoredTokens(tokens) {
  await persistQfTokens(tokens);
}
