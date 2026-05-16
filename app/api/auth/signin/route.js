import { NextResponse } from "next/server";
import { signInWithFallback } from "@/lib/server/authService";
import { setAppSession } from "@/lib/server/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await signInWithFallback({ email, password });
    if (result.error) {
      return NextResponse.json(
        { error: { message: result.error, code: result.code || "AUTH_FAILED" } },
        { status: result.status || 401 },
      );
    }

    await setAppSession(result.user, { qfAccessToken: result.qfAccessToken });
    return NextResponse.json({ user: result.user, usedFallback: result.usedFallback });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error?.message || "Unable to connect. Please try again later", code: "SERVER_ERROR" } },
      { status: 500 },
    );
  }
}
