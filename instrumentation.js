/**
 * Fail fast when Quran Foundation credentials are required but missing.
 * Runs on server startup (Node runtime).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { getQfOAuthConfig } = await import("./lib/api/qfOAuthConfig.js");
  getQfOAuthConfig();
}
