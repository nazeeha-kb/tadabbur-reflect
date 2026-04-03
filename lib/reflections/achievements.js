import { getDailyReflectionStreak } from "@/lib/reflections/stats";

export function getNextMilestoneTarget(total) {
  const n = Number(total) || 0;
  const goals = [10, 25, 50, 100, 250, 500];
  const next = goals.find((g) => g > n);
  return next ?? n + 50;
}

/**
 * Achievement rows for dashboard (minimal, inspiring copy).
 */
export function getAchievementRows(reflections) {
  const list = Array.isArray(reflections) ? reflections : [];
  const total = list.length;
  const streak = getDailyReflectionStreak(list);
  const uniqueTags = new Set(list.flatMap((r) => r.tags || []));

  return [
    {
      id: "first",
      label: "First Reflection",
      unlocked: total >= 1,
      tone: "teal",
    },
    {
      id: "three-streak",
      label: "3 Day Streak",
      unlocked: streak >= 3,
      tone: "peach",
    },
    {
      id: "seven-streak",
      label: "7 Day Streak",
      unlocked: streak >= 7,
      tone: "teal",
    },
    {
      id: "ten",
      label: "10 Reflections Written",
      unlocked: total >= 10,
      tone: "teal",
    },
    {
      id: "consistency",
      label: "Consistency Builder",
      unlocked: streak >= 5 && total >= 5,
      tone: "peach",
    },
    {
      id: "themes",
      label: "3 Themes Explored",
      unlocked: uniqueTags.size >= 3,
      tone: "sky",
    },
  ];
}
