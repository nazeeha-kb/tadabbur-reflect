export function toUtcDateString(dateInput = new Date()) {
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateDiffInDays(fromUtcDateString, toUtcDateStringValue) {
  const from = new Date(`${fromUtcDateString}T00:00:00.000Z`).getTime();
  const to = new Date(`${toUtcDateStringValue}T00:00:00.000Z`).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

export function calculateStreak(current, activityDate = new Date()) {
  const today = toUtcDateString(activityDate);
  const previous = current || {};
  const lastActiveDate = previous.lastActiveDate || null;

  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, Number(previous.longestStreak || 0)),
      lastActiveDate: today,
    };
  }

  const dayDiff = dateDiffInDays(lastActiveDate, today);
  if (dayDiff <= 0) {
    return {
      currentStreak: Number(previous.currentStreak || 1),
      longestStreak: Number(previous.longestStreak || previous.currentStreak || 1),
      lastActiveDate: lastActiveDate,
    };
  }

  const currentStreak = dayDiff === 1 ? Number(previous.currentStreak || 0) + 1 : 1;
  const longestStreak = Math.max(Number(previous.longestStreak || 0), currentStreak);
  return { currentStreak, longestStreak, lastActiveDate: today };
}
