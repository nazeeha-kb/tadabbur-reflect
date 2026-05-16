import "server-only";

/**
 * Server auth diagnostics. Enable with QF_AUTH_DEBUG=1 or QF_DEBUG_API=1 in .env.local.
 * Never logs tokens, secrets, or authorization codes.
 */
export function isAuthDebugEnabled() {
  const v = (process.env.QF_AUTH_DEBUG || process.env.QF_DEBUG_API || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function authLog(event, details = {}) {
  if (!isAuthDebugEnabled()) return;
  const safe = { ...details };
  for (const key of Object.keys(safe)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("password") ||
      lower.includes("code")
    ) {
      safe[key] = "[redacted]";
    }
  }
  console.info(`[auth] ${event}`, safe);
}
