const GUEST_PROFILE_KEY = "guest_profile_v1";

export function loadGuestProfile() {
  if (typeof window === "undefined") return { name: "Guest", avatarUrl: null };
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return { name: "Guest", avatarUrl: null };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Guest",
      avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : null,
    };
  } catch {
    return { name: "Guest", avatarUrl: null };
  }
}

export function saveGuestProfile(profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    GUEST_PROFILE_KEY,
    JSON.stringify({
      name: profile.name?.trim() || "Guest",
      avatarUrl: profile.avatarUrl || null,
    }),
  );
}

export function clearGuestProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_PROFILE_KEY);
}
