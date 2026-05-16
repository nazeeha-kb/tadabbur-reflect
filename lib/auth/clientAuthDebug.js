/** Client-side auth diagnostics. Enable with NEXT_PUBLIC_AUTH_DEBUG=1 */
export function authClientLog(event, details = {}) {
  if (process.env.NEXT_PUBLIC_AUTH_DEBUG !== "1") return;
  console.info(`[auth:client] ${event}`, details);
}
