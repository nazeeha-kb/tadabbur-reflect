export const HOME_SEARCH_QUERY_KEY = "tadabbur-home-search-query";

/** Original user search text used to generate this reflection. */
export function getReflectionSearchQuery(reflection) {
  if (!reflection) return "";
  return (
    reflection.searchQuery?.trim() ||
    reflection.emotion?.trim() ||
    reflection.userInput?.trim() ||
    ""
  );
}

export function persistHomeSearchQuery(query) {
  if (typeof window === "undefined") return;
  const trimmed = query?.trim();
  if (!trimmed) return;
  try {
    window.sessionStorage.setItem(HOME_SEARCH_QUERY_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}
