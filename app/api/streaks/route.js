import { NextResponse } from "next/server";
import resolveAuthUser from "@/lib/auth/resolveAuthUser";
import getOrCreateAppUser from "@/lib/auth/getOrCreateAppUser";
import { getSessionUser } from "@/lib/server/session";
import { getStreakWithFallback } from "@/lib/qf/streaks";

/**
 * GET /api/streaks — QF activity streak with Firestore fallback.
 */
export async function GET(request) {
  try {
    const auth = await resolveAuthUser(request);
    let appUserId = auth?.appUserId || null;

    if (!appUserId) {
      const sessionUser = await getSessionUser();
      if (sessionUser?.id && sessionUser.provider === "quran-foundation") {
        const mapped = await getOrCreateAppUser("qf", String(sessionUser.id), {
          email: sessionUser.email,
          name: sessionUser.name,
        });
        appUserId = mapped.appUserId;
      }
    }

    const streak = await getStreakWithFallback({ appUserId });
    if (!streak) {
      return NextResponse.json({ currentStreak: 0, longestStreak: 0, source: "none" });
    }

    return NextResponse.json(streak);
  } catch (error) {
    console.error(JSON.stringify({ event: "streak.fetch.error", message: String(error?.message || error) }));
    console.log(await res.text());
    return NextResponse.json({ currentStreak: 0, longestStreak: 0, source: "error" });
  }
}
