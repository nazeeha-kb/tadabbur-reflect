const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Run an async function with AbortController timeout.
 * @param {() => Promise<T>} fn
 * @param {{ timeoutMs?: number, label?: string }} [options]
 * @returns {Promise<T>}
 */
export async function withTimeout(fn, { timeoutMs = DEFAULT_TIMEOUT_MS, label = "request" } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      const timeoutErr = new Error(`${label} timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      timeoutErr.code = "TIMEOUT";
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retry once on transient failures with short backoff.
 * @param {() => Promise<T>} fn
 * @param {{ logRetry?: (meta: object) => void }} [options]
 */
export async function withRetryOnce(fn, { logRetry } = {}) {
  try {
    return await fn();
  } catch (first) {
    const msg = String(first?.message || first).toLowerCase();
    const transient =
      first?.code === "TIMEOUT" ||
      first?.name === "TimeoutError" ||
      /fetch failed|network|econnreset|etimedout|502|503|504/i.test(msg);

    if (!transient) throw first;

    logRetry?.({ message: msg });
    await new Promise((r) => setTimeout(r, 300));
    return fn();
  }
}
