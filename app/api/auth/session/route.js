import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { maintainQfTokens } from "@/lib/server/qfTokens";
import { authLog } from "@/lib/server/authDebug";
import { calculateStreak } from "@/lib/streak/streakService";
import { getStreakForUser, saveStreakForUser } from "@/lib/server/localUserStore";
import getOrCreateAppUser from "@/lib/auth/getOrCreateAppUser";
import { getStreakWithFallback } from "@/lib/qf/streaks";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    authLog("session.check", { authenticated: false });
    return NextResponse.json({ authenticated: false });
  }

  let qfApiOk = null;
  if (user.provider === "quran-foundation") {
    const maintenance = await maintainQfTokens();
    qfApiOk = maintenance.ok;
  }

  let streak = null;
  if (user.kind === "user") {
    let appUserId = null;
    try {
      if (user.provider === "quran-foundation") {
        const mapped = await getOrCreateAppUser("qf", String(user.id), { email: user.email, name: user.name });
        appUserId = mapped.appUserId;
      }
    } catch {
      /* use local streak only */
    }

    const qfStreak = appUserId ? await getStreakWithFallback({ appUserId }) : null;
    if (qfStreak?.currentStreak != null) {
      streak = {
        currentStreak: qfStreak.currentStreak,
        longestStreak: qfStreak.longestStreak ?? qfStreak.currentStreak,
        lastActiveDate: qfStreak.lastActiveDate ?? null,
      };
    } else {
      const current = await getStreakForUser(user.id);
      streak = calculateStreak(current);
      await saveStreakForUser(user.id, streak);
    }
  }

  authLog("session.check", {
    authenticated: true,
    provider: user.provider,
    qfApiOk,
  });

  return NextResponse.json({
    authenticated: true,
    user,
    streak,
    qfApiOk,
  });
}
