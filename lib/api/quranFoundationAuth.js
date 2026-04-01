/**
 * Quran Foundation — access token + authenticated Content API fetches (server-only).
 *
 * Confidential client (default): `token_endpoint_auth_method=client_secret_basic` — QF_CLIENT_ID + QF_CLIENT_SECRET,
 * Authorization: Basic base64(client_id:client_secret).
 *
 * Public client (only if provisioned `token_endpoint_auth_method=none`): omit QF_CLIENT_SECRET — POST body only
 * (grant_type, scope, client_id). Do not log secrets; error messages never include credentials.
 */

import { formatOAuthDebugHint, isQuranFoundationApiDebugEnabled } from "@/lib/api/qfApiDebug";
import { getQfOAuthConfig } from "@/lib/api/qfOAuthConfig";

/** Content API v4 path prefix under apiBaseUrl */
const CONTENT_API_PREFIX = "/content/api/v4";

let cached = { accessToken: "", expiresAtMs: 0 };

/** Set when OAuth rejects `search` scope — use public api.quran.com for keyword search until scope is granted. */
let searchScopeDenied = false;

export function isQuranFoundationConfigured() {
  return Boolean(process.env.QF_CLIENT_ID?.trim());
}

export function isPublicSearchFallbackActive() {
  return searchScopeDenied;
}

function isSearchScopeRejectedByProvider(detailText) {
  try {
    const j = JSON.parse(detailText);
    if (j.error === "invalid_scope") return true;
    const d = String(j.error_description || "").toLowerCase();
    if (d.includes("search") && (d.includes("scope") || d.includes("allowed"))) return true;
  } catch {
    return /invalid_scope/i.test(detailText);
  }
  return false;
}

function getContentApiRoot() {
  const { apiBaseUrl } = getQfOAuthConfig();
  return `${apiBaseUrl.replace(/\/$/, "")}${CONTENT_API_PREFIX}`;
}

async function fetchAccessToken() {
  const { authBaseUrl, clientId, clientSecret } = getQfOAuthConfig();
  const tokenUrl = `${authBaseUrl.replace(/\/$/, "")}/oauth2/token`;

  const scope = searchScopeDenied ? "content" : "content search";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  } else {
    body.set("client_id", clientId);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    if (
      response.status === 400 &&
      !searchScopeDenied &&
      scope === "content search" &&
      isSearchScopeRejectedByProvider(detail)
    ) {
      searchScopeDenied = true;
      cached = { accessToken: "", expiresAtMs: 0 };
      return fetchAccessToken();
    }
    if (isQuranFoundationApiDebugEnabled()) {
      throw new Error(`Quran Foundation token request failed${formatOAuthDebugHint(response.status, detail)}`);
    }
    throw new Error(`Quran Foundation token request failed (${response.status})`);
  }

  const data = await response.json();
  const expiresInSec = Number(data.expires_in ?? 3600);
  cached = {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };
  return cached.accessToken;
}

export async function getQuranFoundationAccessToken() {
  const now = Date.now();
  if (cached.accessToken && now < cached.expiresAtMs - 60_000) {
    return cached.accessToken;
  }
  return fetchAccessToken();
}

/**
 * GET/POST to Content API v4 with required headers.
 * @param {string} pathAndQuery e.g. "/search?q=grief&size=5&page=1"
 */
export async function quranFoundationFetch(pathAndQuery, init = {}) {
  const { clientId } = getQfOAuthConfig();
  const contentBase = getContentApiRoot();
  const token = await getQuranFoundationAccessToken();
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const url = `${contentBase}${path}`;

  const headers = new Headers(init.headers);
  headers.set("x-auth-token", token);
  headers.set("x-client-id", clientId);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return fetch(url, { ...init, headers });
}

/**
 * Call APIs rooted at `apiBaseUrl` (e.g. Search API `GET /v1/search`), not under `/content/api/v4`.
 */
export async function quranFoundationApiFetch(pathAndQuery, init = {}) {
  const { apiBaseUrl, clientId } = getQfOAuthConfig();
  const token = await getQuranFoundationAccessToken();
  const base = apiBaseUrl.replace(/\/$/, "");
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const url = `${base}${path}`;

  const headers = new Headers(init.headers);
  headers.set("x-auth-token", token);
  headers.set("x-client-id", clientId);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return fetch(url, { ...init, headers });
}
