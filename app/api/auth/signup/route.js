import { NextResponse } from "next/server";
import { signUpWithFallback } from "@/lib/server/authService";
import { setAppSession } from "@/lib/server/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and password (minimum 8 chars) are required." },
        { status: 400 },
      );
    }

    const result = await signUpWithFallback({ name, email, password });
    if (result.error) {
      return NextResponse.json(
        { error: { message: result.error, code: result.code || "SIGNUP_FAILED" } },
        { status: result.status || 400 },
      );
    }

    await setAppSession(result.user, { qfAccessToken: result.qfAccessToken });
    return NextResponse.json({ user: result.user, usedFallback: result.usedFallback, warning: result.warning || null });
  } catch (error) {
    return NextResponse.json(
      { error: { message: error?.message || "Unable to connect. Please try again later", code: "SERVER_ERROR" } },
      { status: 500 },
    );
  }
}
