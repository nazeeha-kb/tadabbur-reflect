import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { calculateStreak } from "@/lib/streak/streakService";
import { getStreakForUser, saveStreakForUser } from "@/lib/server/localUserStore";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.kind !== "user") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const streak = (await getStreakForUser(user.id)) || {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
  };

  return NextResponse.json({ streak });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user || user.kind !== "user") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const current = await getStreakForUser(user.id);
  const next = calculateStreak(current);
  await saveStreakForUser(user.id, next);

  return NextResponse.json({ streak: next });
}
