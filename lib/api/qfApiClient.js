import "server-only";

import { getQfOAuthConfig } from "./qfOAuthConfig";
import { refreshAccessToken } from "../auth/qfPkceAuth";

// Global map to prevent refresh stampede per refresh_token
const refreshPromises = new Map();

/**
 * Creates an authenticated API client for Quran Foundation User APIs.
 * Automatically injects x-auth-token and x-client-id headers.
 * Handles 401 with one refresh + retry.
 */
export function createQfApiClient({ accessToken, refreshToken, onTokensUpdate, isConfidential }) {
  const { apiBaseUrl, clientId } = getQfOAuthConfig();
  const baseUrl = `${apiBaseUrl.replace(/\/$/, "")}/auth/v1`;

  let currentAccessToken = accessToken;
  let currentRefreshToken = refreshToken;

  return {
    async fetch(url, options = {}) {
      const fullUrl = `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;

      const headers = {
        ...options.headers,
        "x-auth-token": currentAccessToken,
        "x-client-id": clientId,
      };

      let response = await fetch(fullUrl, { ...options, headers });

      if (response.status === 401 && currentRefreshToken) {
        let refreshPromise;
        if (refreshPromises.has(currentRefreshToken)) {
          refreshPromise = refreshPromises.get(currentRefreshToken);
        } else {
          refreshPromise = refreshAccessToken({ refreshToken: currentRefreshToken, isConfidential });
          refreshPromises.set(currentRefreshToken, refreshPromise);
        }

        try {
          const newTokens = await refreshPromise;
          onTokensUpdate(newTokens);
          currentAccessToken = newTokens.access_token;
          currentRefreshToken = newTokens.refresh_token;
          // Retry with new token
          headers["x-auth-token"] = currentAccessToken;
          response = await fetch(fullUrl, { ...options, headers });
        } catch (refreshError) {
          throw new Error("Authentication failed");
        } finally {
          refreshPromises.delete(currentRefreshToken);
        }
      }

      return response;
    },
  };
}