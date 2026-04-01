import { NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/auth/qfPkceAuth";

/**
 * Starts Authorization Code + PKCE flow: sets PKCE cookie and redirects to /oauth2/auth.
 * Set QF_OAUTH_REDIRECT_URI to this app's callback URL (e.g. http://localhost:3000/api/auth/callback).
 */
export async function GET() {
  const redirectUri = process.env.QF_OAUTH_REDIRECT_URI?.trim();
  if (!redirectUri) {
    return NextResponse.json(
      { error: "QF_OAUTH_REDIRECT_URI is not set (must match the redirect URI registered with Quran Foundation)." },
      { status: 500 },
    );
  }

  const scopes = process.env.QF_OAUTH_SCOPES?.split(/\s+/).filter(Boolean);
  const { url } = await buildAuthorizationUrl({
    redirectUri,
    scopes: scopes?.length ? scopes : undefined,
  });

  return NextResponse.redirect(url);
}
