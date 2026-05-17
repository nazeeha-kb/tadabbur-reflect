import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { resolveTranslationResourceId } from "@/lib/quran/sdk/resources";
import { TAFSEER_SOURCES } from "@/lib/tafseerSources";
import { searchDebug } from "@/lib/search/searchDebug";

let cachedTafsirResources = null;

const FALLBACK_SOURCE_IDS = ["ibn-kathir-abridged", "tazkirul-quran"];

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
  if (meta.id === "ibn-kathir-abridged") {
    const ibn = resources.find((r) => /ibn.?kathir/i.test(`${r.slug || ""} ${r.name || ""}`));
    if (ibn) return Number(ibn.id);
  }
  if (meta.id === "tazkirul-quran") {
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

/** Ordered SDK resource ids to try: requested → ibn-kathir → tazkirul → default. */
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

  for (const sourceId of FALLBACK_SOURCE_IDS) {
    add(resolveTafsirResourceIdFromCatalog(sourceId, resources));
  }

  const english = resources.find((r) => /english|en-/i.test(String(r.slug || r.name || "")));
  add(english ? Number(english.id) : null);
  add(Number(resources[0].id));

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
    const verse = await client.content.v4.verses.byKey(verseKey, {
      tafsirs: [tafsirResourceId],
      translations: [translationResourceId],
      words: false,
    });
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
  try {
    const translationResourceId = await resolveTranslationResourceId();
    const chain = await resolveTafsirResourceIdChain(requestedSourceId);

    for (const resourceId of chain) {
      const text = await fetchTafsirTextForResource(verseKey, resourceId, translationResourceId);
      if (text) {
        searchDebug("sdk.tafsir.hit", { verseKey, resourceId, requested: requestedSourceId });
        return text;
      }
    }

    searchDebug("sdk.tafsir.miss", { verseKey, requested: requestedSourceId, tried: chain });
    return null;
  } catch (err) {
    searchDebug("sdk.tafsir.fallback_error", { verseKey, message: err?.message });
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
