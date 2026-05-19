import { NextResponse } from "next/server";
import { buildAuthorizationUrl, resolveOAuthRedirectUri } from "@/lib/auth/qfPkceAuth";

/**
 * Starts Authorization Code + PKCE flow: sets PKCE cookie and redirects to /oauth2/auth.
 * Set QF_OAUTH_REDIRECT_URI to this app's callback URL (e.g. http://localhost:3000/api/auth/callback).
 */
export async function GET(request) {
  const redirectUri = resolveOAuthRedirectUri(request.url);
  if (!redirectUri) {
    return NextResponse.json(
      { error: "QF_REDIRECT_URI is not set (must match Quran Foundation registered redirect URI)." },
      { status: 500 },
    );
  }

  const clientId = process.env.QF_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing Quran Foundation credentials (QF_CLIENT_ID not configured). Contact support or try guest mode." },
      { status: 503 },
    );
  }

  const scopes = process.env.QF_OAUTH_SCOPES?.split(/\s+/).filter(Boolean);
  
  try {
    const { url } = await buildAuthorizationUrl({
      redirectUri,
      scopes: scopes?.length ? scopes : undefined,
    });

    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("Missing Quran Foundation API credentials")) {
      return NextResponse.json(
        { error: "Quran Foundation OAuth is not configured. Try guest mode or contact support." },
        { status: 503 },
      );
    }
    console.error("[api/auth/login] Unexpected error:", msg);
    return NextResponse.json(
      { error: "Unable to initialize OAuth flow. Please try again later." },
      { status: 500 },
    );
  }
}
