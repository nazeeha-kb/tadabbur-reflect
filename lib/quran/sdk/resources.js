import { getQfSdkClient } from "@/lib/quran/sdk/client";
import { PREFERRED_TRANSLATION_RESOURCE_ID } from "@/lib/quran/sdk/constants";
import { searchDebug } from "@/lib/search/searchDebug";

let cachedTranslationId = null;

/**
 * Resolve a translation resource id valid for the current QF environment (prelive vs production).
 */
export async function resolveTranslationResourceId() {
  if (cachedTranslationId) return cachedTranslationId;

  const client = getQfSdkClient();
  const list = await client.content.v4.resources.translations.list();
  const resources = Array.isArray(list) ? list : [];

  const preferred = resources.find((r) => Number(r.id) === PREFERRED_TRANSLATION_RESOURCE_ID);
  const english = resources.filter((r) =>
    /english/i.test(String(r.languageName || r.language_name || "")),
  );
  const englishProse = english.find((r) => !/transliteration/i.test(String(r.name || "")));

  const pick = preferred || englishProse || english[0] || resources[0];
  if (!pick) {
    throw new Error("No translation resources available from Quran Foundation Content API.");
  }

  cachedTranslationId = Number(pick.id);
  searchDebug("sdk.translation.resource", {
    id: cachedTranslationId,
    name: pick.name,
    preferredAvailable: Boolean(preferred),
  });

  return cachedTranslationId;
}
