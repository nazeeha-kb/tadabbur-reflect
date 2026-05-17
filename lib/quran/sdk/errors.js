export const SearchErrorCode = {
  CONFIG: "CONFIG",
  INVALID_QUERY: "INVALID_QUERY",
  EMPTY: "EMPTY",
  NETWORK: "NETWORK",
  SDK_AUTH: "SDK_AUTH",
  SDK: "SDK",
};

export class QuranSearchError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "QuranSearchError";
    this.code = code;
    this.cause = options.cause;
  }
}

/** @deprecated Use QuranSearchError with code SDK_AUTH */
export class QfSdkAuthError extends QuranSearchError {
  constructor(message, options = {}) {
    super(SearchErrorCode.SDK_AUTH, message, options);
    this.name = "QfSdkAuthError";
  }
}

/** @deprecated Use QuranSearchError with code INVALID_QUERY */
export class QfInvalidQueryError extends QuranSearchError {
  constructor(message, options = {}) {
    super(SearchErrorCode.INVALID_QUERY, message, options);
    this.name = "QfInvalidQueryError";
  }
}

export function isNetworkError(err) {
  const message = String(err?.message || err).toLowerCase();
  return (
    err?.name === "TypeError" ||
    /fetch failed|network|econnreset|etimedout|enotfound|socket/i.test(message)
  );
}

export function isSdkAuthError(err) {
  if (!err) return false;
  const message = String(err.message || err).toLowerCase();
  return /401|unauthoriz|unauthenticated|token request failed|invalid_client|invalid_grant|access token|x-auth-token/i.test(
    message,
  );
}

export function toQuranSearchError(err, fallbackMessage = "Quran Foundation SDK request failed.") {
  if (err instanceof QuranSearchError) return err;
  if (isNetworkError(err)) {
    return new QuranSearchError(SearchErrorCode.NETWORK, "Check your connection and try again.", { cause: err });
  }
  if (isSdkAuthError(err)) {
    return new QuranSearchError(
      SearchErrorCode.SDK_AUTH,
      `Quran Foundation authentication failed: ${err?.message || "invalid credentials or environment (QF_ENV)."}`,
      { cause: err },
    );
  }
  const message = err?.message ? String(err.message) : fallbackMessage;
  return new QuranSearchError(SearchErrorCode.SDK, message, { cause: err });
}
