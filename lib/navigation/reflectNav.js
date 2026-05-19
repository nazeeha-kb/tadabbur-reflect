import { persistHomeSearchQuery } from "@/lib/reflections/searchQuery";
import { searchDebug } from "@/lib/search/searchDebug";

export function buildReflectSearchUrl(query, tafseerSource) {
  const trimmed = query?.trim();
  if (!trimmed) return "/reflect";
  const params = new URLSearchParams({ q: trimmed });
  if (tafseerSource?.trim()) params.set("tafseer", tafseerSource.trim());
  return `/reflect?${params.toString()}`;
}

/** Navigate to reflect results immediately; persist query for home search bar. */
export function navigateToReflectSearch(router, { query, tafseerSource }) {
  const trimmed = query?.trim();
  if (!trimmed) return;
  const href = buildReflectSearchUrl(trimmed, tafseerSource);
  persistHomeSearchQuery(trimmed);
  searchDebug("navigate.submit", { href, query: trimmed });
  try {
    router.prefetch(href);
  } catch {
    /* ignore */
  }
  router.push(href);
}
