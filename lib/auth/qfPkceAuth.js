import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getQfOAuthConfig } from "@/lib/api/qfOAuthConfig";

/** httpOnly cookie holding signed PKCE + OIDC session (never expose to browser JS) */
const PKCE_COOKIE_NAME = "qf_oauth_pkce";
const PKCE_COOKIE_MAX_AGE_SEC = 600;

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
    scopes && scopes.length > 0 ? scopes : ["openid", "offline_access", "content"];
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
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (confidential && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetch(tokenUrl, { method: "POST", headers, body });

  if (!response.ok) {
    throw new Error("Failed to exchange authorization code for tokens");
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
    client_id: clientId,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (confidential && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
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

/**
 * Get stored tokens from cookies.
 */
export async function getStoredTokens() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('qf_access_token')?.value;
  const refreshToken = cookieStore.get('qf_refresh_token')?.value;
  return { accessToken, refreshToken };
}

/**
 * Update stored tokens in cookies.
 */
export async function updateStoredTokens(tokens) {
  const cookieStore = await cookies();
  if (tokens.access_token) {
    cookieStore.set('qf_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });
  }
  if (tokens.refresh_token) {
    cookieStore.set('qf_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
}
