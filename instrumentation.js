/**
 * Validate Quran Foundation credentials if provided.
 * Runs on server startup (Node runtime).
 * Does NOT crash if credentials are missing — deferred to route handlers.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const { getQfOAuthConfig } = await import("./lib/api/qfOAuthConfig.js");
    getQfOAuthConfig();
  } catch (err) {
    // Log but don't crash — let route handlers respond gracefully
    const msg = err?.message || String(err);
    if (msg.includes("Missing Quran Foundation API credentials")) {
      console.warn(
        "[startup] Warning: Quran Foundation credentials not configured. OAuth routes will not be available.",
      );
    } else {
      console.error("[startup] Unexpected error during QF config validation:", msg);
    }
  }
}
