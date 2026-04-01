import { NextResponse } from "next/server";
import { exchangeAuthorizationCode, validateStateAndConsumePkceSession, updateStoredTokens } from "@/lib/auth/qfPkceAuth";

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
    const msg = oauthDesc || oauthError;
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(msg.slice(0, 200))}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code_or_state", request.url));
  }

  try {
    const { codeVerifier, redirectUri } = await validateStateAndConsumePkceSession(state);
    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri,
      codeVerifier,
    });
    await updateStoredTokens(tokens);

    return NextResponse.redirect(new URL("/?auth=ok", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?auth_error=session_invalid", request.url));
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to exchange authorization code for tokens" }, { status: 500 });
  }
}
