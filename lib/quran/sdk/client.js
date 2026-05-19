import "server-only";

import { createServerClient } from "@quranjs/api/server";
import { getQfOAuthConfig } from "@/lib/api/qfOAuthConfig";
import { QuranSearchError, SearchErrorCode } from "@/lib/quran/sdk/errors";

let clientInstance = null;

function buildSdkServices({ authBaseUrl, apiBaseUrl }) {
  const apiRoot = apiBaseUrl.replace(/\/$/, "");
  const authRoot = authBaseUrl.replace(/\/$/, "");
  // Gateway layout: {gateway}/search/v1, {gateway}/content/api/v4, etc. (see @quranjs/api service-config)
  return {
    oauth2BaseUrl: authRoot,
    tokenHost: authRoot,
    gatewayUrl: apiRoot,
  };
}

export function isQfSdkConfigured() {
  try {
    getQfOAuthConfig();
    return true;
  } catch {
    return false;
  }
}

export function getQfSdkClient() {
  if (!clientInstance) {
    let config;
    try {
      config = getQfOAuthConfig();
    } catch (err) {
      throw new QuranSearchError(
        SearchErrorCode.CONFIG,
        err?.message || "Quran Foundation credentials are not configured.",
        { cause: err },
      );
    }

    const { clientId, clientSecret, authBaseUrl, apiBaseUrl, env } = config;
    if (!clientSecret) {
      throw new QuranSearchError(
        SearchErrorCode.CONFIG,
        "QF_CLIENT_SECRET is required for server-side Search API (confidential client).",
      );
    }

    clientInstance = createServerClient({
      clientId,
      clientSecret,
      services: buildSdkServices({ authBaseUrl, apiBaseUrl }),
    });

    if (process.env.NODE_ENV === "development" || process.env.SEARCH_DEBUG === "1") {
      console.info("[search:sdk.client]", { env, authBaseUrl, apiBaseUrl });
    }
  }

  return clientInstance;
}

/** @deprecated */
export { getQfSdkClient as getQuranFoundationSdkClient };

// Canonical re-export path: @/lib/qf/sdkClient
