import { NextResponse } from "next/server";
import { signInWithGoogle } from "@/lib/server/authService";
import { setAppSession } from "@/lib/server/session";

async function verifyGoogleIdToken(idToken) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) return null;
  const payload = await response.json();
  const expectedAud = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!expectedAud || payload.aud !== expectedAud) return null;
  if (!payload.email) return null;
  return payload;
}

export async function POST(request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: { message: "Google token is required", code: "MISSING_TOKEN" } }, { status: 400 });
    }

    const googlePayload = await verifyGoogleIdToken(idToken);
    if (!googlePayload) {
      return NextResponse.json({ error: { message: "Google authentication failed", code: "INVALID_GOOGLE_TOKEN" } }, { status: 401 });
    }

    const result = await signInWithGoogle({
      email: googlePayload.email,
      name: googlePayload.name || "",
      googleSub: googlePayload.sub,
    });
    if (result.error) {
      return NextResponse.json({ error: { message: result.error, code: result.code || "GOOGLE_AUTH_FAILED" } }, { status: result.status || 400 });
    }

    await setAppSession(result.user);
    return NextResponse.json({ user: result.user, usedFallback: result.usedFallback });
  } catch {
    return NextResponse.json(
      { error: { message: "Unable to connect. Please try again later", code: "NETWORK_ERROR" } },
      { status: 500 },
    );
  }
}
