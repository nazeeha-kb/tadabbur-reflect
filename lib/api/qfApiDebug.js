/**
 * Opt-in API debug hints (server-only). Set QF_DEBUG_API=1 in .env.local.
 * Never includes client_secret, authorization codes, code_verifier, or tokens.
 */

export function isQuranFoundationApiDebugEnabled() {
  const v = process.env.QF_DEBUG_API?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function looksLikeJwt(s) {
  const t = String(s).trim();
  const parts = t.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 10 && /^[A-Za-z0-9_-]+$/.test(p));
}

function looksLikeSecretish(s) {
  if (!s || s.length > 500) return true;
  if (looksLikeJwt(s)) return true;
  return false;
}

/**
 * Parse JSON OAuth / API error bodies; strip anything that could be a token.
 */
export function formatOAuthDebugHint(httpStatus, bodyText) {
  if (!isQuranFoundationApiDebugEnabled()) return "";

  const raw = typeof bodyText === "string" ? bodyText.trim() : "";
  if (!raw) {
    return ` [debug: HTTP ${httpStatus}]`;
  }
  if (raw.startsWith("<!") || raw.startsWith("<html")) {
    return ` [debug: HTTP ${httpStatus} (HTML error body omitted)]`;
  }

  try {
    const j = JSON.parse(raw);
    if (j.error && typeof j.error === "string") {
      let hint = `${j.error}`;
      if (j.error_description && typeof j.error_description === "string") {
        const d = j.error_description.replace(/\s+/g, " ").slice(0, 120);
        if (d && !looksLikeSecretish(d)) {
          hint += ` — ${d}`;
        }
      }
      return ` [debug: HTTP ${httpStatus}] ${hint}`;
    }
    if (j.message && typeof j.message === "string" && !looksLikeSecretish(j.message)) {
      return ` [debug: HTTP ${httpStatus}] ${j.message.slice(0, 120)}`;
    }
  } catch {
    // non-JSON: do not echo raw body (may contain sensitive fragments)
  }

  return ` [debug: HTTP ${httpStatus}]`;
}
