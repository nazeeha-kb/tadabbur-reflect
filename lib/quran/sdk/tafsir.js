import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { resolveTranslationResourceId } from "@/lib/quran/sdk/resources";
import { TAFSEER_SOURCES } from "@/lib/tafseerSources";
import { searchDebug } from "@/lib/search/searchDebug";
import { getCachedTafseer, setCachedTafseer } from "@/lib/quran/sdk/tafseerCache";
import { withTimeout } from "@/lib/quran/sdk/requestUtils";

let cachedTafsirResources = null;

const PRIMARY_SOURCE_ID = "ibn-kathir-abridged";
const FALLBACK_SOURCE_ID = "tazkirul-quran";

function tafseerLog(event, meta = {}) {
  console.info(JSON.stringify({ event, ...meta }));
}

function stripHtml(input = "") {
  return String(input).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function listTafsirResources() {
  if (cachedTafsirResources) return cachedTafsirResources;
  try {
    const client = getQfSdkClient();
    const list = await client.content.v4.resources.tafsirs.list();
    cachedTafsirResources = Array.isArray(list) ? list : [];
    searchDebug("sdk.tafsir.resources", {
      count: cachedTafsirResources.length,
      ids: cachedTafsirResources.map((r) => r.id),
      slugs: cachedTafsirResources.map((r) => r.slug),
    });
  } catch (err) {
    searchDebug("sdk.tafsir.resources_error", { message: err?.message });
    cachedTafsirResources = [];
  }
  return cachedTafsirResources;
}

function matchResourceByMeta(resources, meta) {
  if (!meta) return null;
  const byId = resources.find((r) => Number(r.id) === Number(meta.resourceId));
  if (byId) return Number(byId.id);
  if (meta.slug) {
    const slug = String(meta.slug).toLowerCase();
    const bySlug = resources.find((r) => String(r.slug || "").toLowerCase() === slug);
    if (bySlug) return Number(bySlug.id);
  }
  if (meta.id === PRIMARY_SOURCE_ID) {
    const ibn = resources.find((r) => /ibn.?kathir/i.test(`${r.slug || ""} ${r.name || ""}`));
    if (ibn) return Number(ibn.id);
  }
  if (meta.id === FALLBACK_SOURCE_ID) {
    const bayan = resources.find((r) => /bayan|tazkir/i.test(`${r.slug || ""} ${r.name || ""}`));
    if (bayan) return Number(bayan.id);
  }
  return null;
}

/** Map app source id → SDK resource id, or null if not in catalog. */
export function resolveTafsirResourceIdFromCatalog(sourceId, resources) {
  if (!resources?.length) return null;

  const numeric = Number(sourceId);
  if (Number.isFinite(numeric) && numeric > 0) {
    const byId = resources.find((r) => Number(r.id) === numeric);
    if (byId) return Number(byId.id);
  }

  const slug = String(sourceId || "").trim().toLowerCase();
  const bySlug = resources.find((r) => String(r.slug || "").toLowerCase() === slug);
  if (bySlug) return Number(bySlug.id);

  const meta = TAFSEER_SOURCES.find((s) => s.id === sourceId) || TAFSEER_SOURCES[0];
  return matchResourceByMeta(resources, meta);
}

/** @deprecated Prefer resolveTafsirResourceIdChain */
export async function resolveTafsirResourceId(sourceId) {
  const chain = await resolveTafsirResourceIdChain(sourceId);
  return chain[0] ?? null;
}

/**
 * Ordered SDK resource ids: requested → ibn-kathir-abridged → tazkirul-quran → any English → any.
 */
export async function resolveTafsirResourceIdChain(requestedSourceId) {
  const resources = await listTafsirResources();
  if (!resources.length) return [];

  const chain = [];
  const add = (id) => {
    if (id && !chain.includes(id)) chain.push(id);
  };

  if (requestedSourceId) {
    add(resolveTafsirResourceIdFromCatalog(requestedSourceId, resources));
  }

  add(resolveTafsirResourceIdFromCatalog(PRIMARY_SOURCE_ID, resources));
  add(resolveTafsirResourceIdFromCatalog(FALLBACK_SOURCE_ID, resources));

  const english = resources.find((r) => /english|en-/i.test(String(r.slug || r.name || "")));
  add(english ? Number(english.id) : null);

  for (const resource of resources) {
    if (chain.length >= 6) break;
    add(Number(resource.id));
  }

  searchDebug("sdk.tafsir.resolve", {
    requested: requestedSourceId,
    resolvedChain: chain,
    availableIds: resources.map((r) => r.id),
  });

  return chain;
}

async function fetchTafsirTextForResource(verseKey, tafsirResourceId, translationResourceId) {
  if (!verseKey?.includes(":") || !tafsirResourceId) return null;
  try {
    const client = getQfSdkClient();
    const verse = await withTimeout(
      () =>
        client.content.v4.verses.byKey(verseKey, {
          tafsirs: [tafsirResourceId],
          translations: [translationResourceId],
          words: false,
        }),
      { timeoutMs: 4500, label: "tafseer" },
    );
    const raw = verse?.tafsirs?.[0]?.text;
    const text = typeof raw === "string" ? stripHtml(raw) : "";
    return text || null;
  } catch (err) {
    searchDebug("sdk.tafsir.verse_error", {
      verseKey,
      tafsirResourceId,
      message: err?.message,
    });
    return null;
  }
}

/**
 * Try requested tafsir then fallbacks. Never throws; returns null if unavailable.
 */
export async function fetchTafsirForVerseWithFallback(verseKey, requestedSourceId) {
  const cached = getCachedTafseer(verseKey, requestedSourceId);
  if (cached !== undefined) {
    tafseerLog("tafseer.cache_hit", { verseKey, tafseerSource: requestedSourceId });
    return cached.text;
  }
  tafseerLog("tafseer.cache_miss", { verseKey, tafseerSource: requestedSourceId });

  try {
    const translationResourceId = await resolveTranslationResourceId();
    const chain = await resolveTafsirResourceIdChain(requestedSourceId);
    const primaryId = chain[0] ?? null;

    if (primaryId) {
      const primaryText = await fetchTafsirTextForResource(verseKey, primaryId, translationResourceId);
      if (primaryText) {
        setCachedTafseer(verseKey, requestedSourceId, primaryText, String(primaryId));
        return primaryText;
      }
      tafseerLog("tafseer.primary_failed", { verseKey, requested: requestedSourceId, resourceId: primaryId });
    }

    const fallbackIds = chain.slice(1);
    const fallbackResults = await Promise.all(
      fallbackIds.map(async (resourceId) => {
        const text = await fetchTafsirTextForResource(verseKey, resourceId, translationResourceId);
        return { resourceId, text };
      }),
    );

    for (const { resourceId, text } of fallbackResults) {
      if (text) {
        tafseerLog("tafseer.fallback_used", { verseKey, requested: requestedSourceId, resourceId });
        setCachedTafseer(verseKey, requestedSourceId, text, String(resourceId));
        return text;
      }
    }

    searchDebug("sdk.tafsir.miss", { verseKey, requested: requestedSourceId, tried: chain });
    setCachedTafseer(verseKey, requestedSourceId, null, null);
    return null;
  } catch (err) {
    searchDebug("sdk.tafsir.fallback_error", { verseKey, message: err?.message });
    setCachedTafseer(verseKey, requestedSourceId, null, null);
    return null;
  }
}

export async function attachTafseerToAyahs(ayahs, sourceId) {
  if (!Array.isArray(ayahs) || ayahs.length === 0) return ayahs;

  const texts = await Promise.all(
    ayahs.map((a) => fetchTafsirForVerseWithFallback(a.verseKey, sourceId)),
  );
  return ayahs.map((ayah, i) => ({
    ...ayah,
    tafseer: texts[i] ?? ayah.tafseer ?? null,
  }));
}
