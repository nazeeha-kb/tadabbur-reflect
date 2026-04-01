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

const MISSING_CREDENTIALS_MESSAGE =
  "Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access";

/** Pre-Production — copy exactly */
const PRELIVE = {
  authBaseUrl: "https://prelive-oauth2.quran.foundation",
  apiBaseUrl: "https://apis-prelive.quran.foundation",
};

/** Production — copy exactly */
const PRODUCTION = {
  authBaseUrl: "https://oauth2.quran.foundation",
  apiBaseUrl: "https://apis.quran.foundation",
};

/**
 * @returns {{
 *   env: "prelive" | "production",
 *   clientId: string,
 *   clientSecret: string | undefined,
 *   authBaseUrl: string,
 *   apiBaseUrl: string,
 * }}
 */
export function getQfOAuthConfig() {
  const clientId = process.env.QF_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error(MISSING_CREDENTIALS_MESSAGE);
  }

  const raw = (process.env.QF_ENV || "prelive").trim().toLowerCase();
  if (raw !== "prelive" && raw !== "production") {
    throw new Error('QF_ENV must be "prelive" or "production".');
  }

  const env = raw === "production" ? "production" : "prelive";
  const { authBaseUrl, apiBaseUrl } = env === "prelive" ? PRELIVE : PRODUCTION;

  const secretRaw = process.env.QF_CLIENT_SECRET?.trim();
  const clientSecret = secretRaw ? secretRaw : undefined;

  return {
    env,
    clientId,
    clientSecret,
    authBaseUrl,
    apiBaseUrl,
  };
}
