export function normalizeTimestamp(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }
  return null;
}

export function formatIsoDate(value, options = {}) {
  const date = normalizeTimestamp(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatIsoDateLong(value, options = {}) {
  const date = normalizeTimestamp(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}
