"use client";



import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { authClientLog } from "@/lib/auth/clientAuthDebug";
import { clearGuestProfile, loadGuestProfile } from "@/lib/profile/guestProfile";



const AuthContext = createContext(null);



const GUEST_SESSION_KEY = "guest_session_v1";

const GUEST_STREAK_KEY = "guest_streak_v1";



function toUtcDateString(dateInput = new Date()) {

  const date = new Date(dateInput);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(

    date.getUTCDate(),

  ).padStart(2, "0")}`;

}



function dateDiffInDays(from, to) {

  const start = new Date(`${from}T00:00:00.000Z`).getTime();

  const end = new Date(`${to}T00:00:00.000Z`).getTime();

  return Math.floor((end - start) / (1000 * 60 * 60 * 24));

}



function calculateStreak(current, activityDate = new Date()) {

  const today = toUtcDateString(activityDate);

  if (!current?.lastActiveDate) {

    return { currentStreak: 1, longestStreak: 1, lastActiveDate: today };

  }

  const diff = dateDiffInDays(current.lastActiveDate, today);

  if (diff <= 0) return current;

  const currentStreak = diff === 1 ? Number(current.currentStreak || 0) + 1 : 1;

  return {

    currentStreak,

    longestStreak: Math.max(Number(current.longestStreak || 0), currentStreak),

    lastActiveDate: today,

  };

}



function extractErrorMessage(data, fallback) {

  return data?.error?.message || data?.error || fallback;

}



function mapAuthErrorCode(code) {

  const normalized = String(code || "").toLowerCase();

  if (normalized === "invalid_state") return "Your sign-in session expired. Please try again.";

  if (normalized === "invalid_nonce") return "Security validation failed. Please try signing in again.";

  if (normalized === "token_exchange_failed") return "Could not complete sign-in. Please try again.";

  if (normalized === "expired_session") return "Your session has expired. Please sign in again.";

  if (normalized === "oauth_cancelled") return "Sign-in was cancelled.";

  if (normalized === "network_error") return "Unable to connect right now. Please try again.";

  return null;

}



function clearGuestStorage() {

  try {

    localStorage.removeItem(GUEST_SESSION_KEY);

    localStorage.removeItem(GUEST_STREAK_KEY);

    clearGuestProfile();

  } catch {

    // ignore

  }

}



function loadGuestFromStorage() {

  try {

    const rawGuest = localStorage.getItem(GUEST_SESSION_KEY);

    if (!rawGuest) return null;

    const guest = JSON.parse(rawGuest);

    if (!guest?.id) return null;

    const rawStreak = localStorage.getItem(GUEST_STREAK_KEY);

    const parsed = rawStreak

      ? calculateStreak(JSON.parse(rawStreak))

      : calculateStreak({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });

    localStorage.setItem(GUEST_STREAK_KEY, JSON.stringify(parsed));

    const profile = loadGuestProfile();

    return {

      user: { id: guest.id, name: profile.name || "Guest", email: "", kind: "guest" },

      streak: parsed,

    };

  } catch {

    clearGuestStorage();

    return null;

  }

}



export function AuthProvider({ children }) {

  const [authReady, setAuthReady] = useState(false);

  const [user, setUser] = useState(null);

  const [streak, setStreak] = useState(null);

  const [usedFallback, setUsedFallback] = useState(false);

  const [authModal, setAuthModal] = useState({ open: false, mode: "signin" });

  const justSignedInRef = useRef(false);



  useLayoutEffect(() => {

    const url = new URL(window.location.href);

    const authError = url.searchParams.get("auth_error");

    const authOk = url.searchParams.get("auth");



    if (authError) {

      toast.error(mapAuthErrorCode(authError) || "Authentication failed.");

      url.searchParams.delete("auth_error");

      window.history.replaceState({}, "", url.toString());

    } else if (authOk === "ok") {

      justSignedInRef.current = true;

      clearGuestStorage();

      toast.success("Signed in successfully");

      url.searchParams.delete("auth");

      window.history.replaceState({}, "", url.toString());

    }



    void refreshSession();

  }, []);



  async function refreshSession() {

    authClientLog("hydrate.start");



    try {

      const sessionResponse = await fetch("/api/auth/session", {

        cache: "no-store",

        credentials: "include",

      });

      authClientLog("hydrate.response", { ok: sessionResponse.ok, status: sessionResponse.status });



      if (sessionResponse.ok) {

        const data = await sessionResponse.json();

        if (data.authenticated && data.user) {

          clearGuestStorage();

          const kind = data.user.kind || "user";

          setUser({ ...data.user, kind });

          setStreak(data.streak ?? null);

          setUsedFallback(false);

          authClientLog("hydrate.authenticated", {

            provider: data.user.provider,

            qfApiOk: data.qfApiOk,

          });

          setAuthReady(true);

          justSignedInRef.current = false;

          return;

        }

      }

    } catch (error) {

      authClientLog("hydrate.error", { message: String(error?.message || error) });

    }



    const guest = loadGuestFromStorage();

    if (guest) {

      setUser(guest.user);

      setStreak(guest.streak);

      authClientLog("hydrate.guest");

    } else {

      setUser(null);

      setStreak(null);

      authClientLog("hydrate.anonymous");

    }



    setAuthReady(true);

    justSignedInRef.current = false;

  }



  function startQfSignIn(mode = "signin") {

    authClientLog("login.redirect", { mode });

    setAuthModal({ open: false, mode: "signin" });

    const url = new URL("/api/auth/login", window.location.origin);

    url.searchParams.set("mode", mode);

    window.location.assign(url.toString());

  }



  async function signInWithGoogle(idToken) {

    const response = await fetch("/api/auth/google", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ idToken }),

    });

    const data = await response.json();

    if (!response.ok) throw new Error(extractErrorMessage(data, "Google sign-in failed"));

    clearGuestStorage();

    setUser({ ...data.user, kind: "user" });

    setUsedFallback(Boolean(data.usedFallback));

    setAuthModal({ open: false, mode: "signin" });

    toast.success("Signed in with Google");

    await refreshStreak();

  }



  async function continueAsGuest() {

    authClientLog("guest.start");

    try {

      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });

    } catch {

      // still allow guest if logout fails

    }



    const guestId = `guest_${crypto.randomUUID()}`;

    const guest = { id: guestId, createdAt: new Date().toISOString() };

    const initial = calculateStreak({ currentStreak: 0, longestStreak: 0, lastActiveDate: null });

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guest));

    localStorage.setItem(GUEST_STREAK_KEY, JSON.stringify(initial));

    setUser({ id: guestId, name: "Guest", email: "", kind: "guest" });

    setStreak(initial);

    setAuthModal({ open: false, mode: "signin" });

    toast.success("Continuing as guest");

    authClientLog("guest.ok");

  }



  async function refreshStreak() {

    if (!user) return;

    if (user.kind === "guest") return;

    const response = await fetch("/api/streak", { method: "POST" });

    if (response.ok) {

      const data = await response.json();

      setStreak(data.streak);

    }

  }



  async function trackActivity() {

    if (!user) return;

    if (user.kind === "guest") {

      const current = streak || { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

      const next = calculateStreak(current);

      setStreak(next);

      localStorage.setItem(GUEST_STREAK_KEY, JSON.stringify(next));

      return;

    }

    await refreshStreak();

  }



  function updateGuestDisplayName(name) {

    if (user?.kind !== "guest") return;

    const trimmed = String(name || "").trim() || "Guest";

    setUser((prev) => (prev ? { ...prev, name: trimmed } : prev));

  }



  async function signOut() {

    authClientLog("logout.start");

    if (user?.kind !== "guest") {

      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });

    }

    clearGuestStorage();

    setUser(null);

    setStreak(null);

    setUsedFallback(false);

    toast.success("Signed out");

    authClientLog("logout.ok");

  }



  const value = useMemo(

    () => ({

      authReady,

      user,

      streak,

      usedFallback,

      isAuthenticated: Boolean(user),

      openSignIn: () => setAuthModal({ open: true, mode: "signin" }),

      openSignUp: () => setAuthModal({ open: true, mode: "signup" }),

      closeAuthModal: () => setAuthModal((prev) => ({ ...prev, open: false })),

      authModal,

      startQfSignIn,

      signInWithGoogle,

      continueAsGuest,

      signOut,

      refreshSession,

      trackActivity,

      updateGuestDisplayName,

    }),

    [authReady, authModal, streak, usedFallback, user],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error("useAuth must be used within AuthProvider");

  }

  return context;

}


