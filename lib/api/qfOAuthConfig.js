/**
 * Quran Foundation OAuth2 — explicit environment mapping (server-only).
 *
 * Intended pattern (default): confidential client with `token_endpoint_auth_method=client_secret_basic`
 * (Request Access clients). Obtain tokens only on the backend; never ship QF_CLIENT_SECRET to browsers
 * or native apps — use a backend/native exchange if the user-facing app cannot hold a secret.
 *
 * Public client (only if Quran Foundation explicitly provisioned `token_endpoint_auth_method=none`):
 * omit QF_CLIENT_SECRET; the token request must not use HTTP Basic with a secret (see token fetch module).
 */

import "server-only";

const MISSING_CREDENTIALS_MESSAGE =
  "Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access";

/** Pre-Production — copy exactly */
const PRELIVE = {
  baseUrl: "https://prelive-oauth2.quran.foundation",
  apiBaseUrl: "https://apis-prelive.quran.foundation",
};

/** Production — copy exactly */
const PRODUCTION = {
  baseUrl: "https://oauth2.quran.foundation",
  apiBaseUrl: "https://apis.quran.foundation",
};

/**
 * @returns {{
 *   env: "prelive" | "production",
 *   clientId: string,
 *   clientSecret: string | undefined,
 *   baseUrl: string,
 *   apiBaseUrl: string,
 * }}
 */
export function getQfOAuthConfig() {
  const clientId = process.env.QF_CLIENT_ID?.trim();
  const hasClientId = Boolean(clientId);
  const hasClientSecret = Boolean(process.env.QF_CLIENT_SECRET?.trim());
  const qfEnv = (process.env.QF_ENV || "prelive").trim().toLowerCase();
  
  console.log("[qfOAuthConfig] env vars check:", {
    hasQF_CLIENT_ID: hasClientId,
    hasQF_CLIENT_SECRET: hasClientSecret,
    QF_ENV: qfEnv,
  });
  
  if (!clientId) {
    throw new Error(MISSING_CREDENTIALS_MESSAGE);
  }

  if (qfEnv !== "prelive" && qfEnv !== "production") {
    throw new Error('QF_ENV must be "prelive" or "production".');
  }

  const env = qfEnv === "production" ? "production" : "prelive";
  const { baseUrl, apiBaseUrl } = env === "prelive" ? PRELIVE : PRODUCTION;

  const secretRaw = process.env.QF_CLIENT_SECRET?.trim();
  const clientSecret = secretRaw ? secretRaw : undefined;

  console.log("[qfOAuthConfig] resolved config:", {
    env,
    baseUrl,
    apiBaseUrl,
  });

  return {
    env,
    clientId,
    clientSecret,
    baseUrl,
    apiBaseUrl,
  };
}
