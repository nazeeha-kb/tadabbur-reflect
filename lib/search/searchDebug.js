const ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.SEARCH_DEBUG === "1" ||
  process.env.NEXT_PUBLIC_SEARCH_DEBUG === "1";

export function searchDebug(scope, payload) {
  if (!ENABLED) return;
  const label = `[search:${scope}]`;
  if (payload !== undefined) {
    console.info(label, payload);
  } else {
    console.info(label);
  }
}
