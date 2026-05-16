import { NextResponse } from "next/server";
import {
  exchangeAuthorizationCode,
  fetchQfUserProfile,
  sessionUserFromIdTokenClaims,
  validateStateAndConsumePkceSession,
  validateIdTokenClaims,
} from "@/lib/auth/qfPkceAuth";
import { setAppSession } from "@/lib/server/session";
import { authLog } from "@/lib/server/authDebug";

/**
 * OAuth2 authorization code callback: validate state (CSRF), exchange code using persisted PKCE verifier.
 * Does not log code_verifier, tokens, or client_secret.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent("oauth_cancelled")}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?auth_error=invalid_state", request.url));
  }

  try {
    authLog("callback.start", { hasCode: true, hasState: true });
    const { codeVerifier, redirectUri, nonce } = await validateStateAndConsumePkceSession(state);
    authLog("callback.pkce_ok", { redirectUri });

    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri,
      codeVerifier,
    });

    if (!tokens.access_token) {
      throw new Error("token_exchange_failed");
    }

    authLog("callback.exchange_ok", {
      hasIdToken: Boolean(tokens.id_token),
      hasRefresh: Boolean(tokens.refresh_token),
      expiresIn: tokens.expires_in,
    });

    const user =
      tokens.id_token != null
        ? sessionUserFromIdTokenClaims(
            validateIdTokenClaims({ idToken: tokens.id_token, expectedNonce: nonce }),
          )
        : await fetchQfUserProfile(tokens.access_token);

    await setAppSession(user, { qfTokens: tokens });

    authLog("callback.session_ok", { userId: user.id });
    return NextResponse.redirect(new URL("/?auth=ok", request.url));
  } catch (error) {
    authLog("callback.error", { message: String(error?.message || error) });
    const codeValue = String(error?.message || "");
    const known =
      codeValue === "invalid_nonce" ||
      codeValue === "invalid_state" ||
      codeValue === "expired_session" ||
      codeValue === "invalid_id_token_sub";
    const redirectCode = known ? codeValue : "token_exchange_failed";
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(redirectCode)}`, request.url));
  }
}

/**
 * Frontend/native app + backend exchange: accept code + codeVerifier from app, exchange for tokens.
 * Assumes public client (isConfidential=false).
 */
export async function POST(request) {
  try {
    const { code, redirectUri, codeVerifier } = await request.json();

    if (!code || !redirectUri || !codeVerifier) {
      return NextResponse.json({ error: "Missing required fields: code, redirectUri, codeVerifier" }, { status: 400 });
    }

    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri,
      codeVerifier,
      isConfidential: false,
    });

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "token_exchange_failed" }, { status: 500 });
  }
}
