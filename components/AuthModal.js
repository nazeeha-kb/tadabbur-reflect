"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.8-.1-1.2H12z" />
    </svg>
  );
}

export default function AuthModal() {
  const {
    authModal,
    closeAuthModal,
    openSignIn,
    openSignUp,
    startQfSignIn,
    signInWithGoogle,
    continueAsGuest,
  } = useAuth();
  const [loading, setLoading] = useState(false);

  const mode = authModal.mode;
  const isOpen = authModal.open;

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  const googleEnabled = useMemo(() => Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID), []);

  if (!isOpen) return null;

  function handleQfStart() {
    startQfSignIn(mode);
  }

  async function handleGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) {
      toast.error("Google sign-in is not configured.");
      return;
    }

    setLoading(true);
    try {
      const idToken = await new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) reject(new Error("Google authentication failed"));
            else resolve(response.credential);
          },
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("Google sign-in was cancelled"));
          }
        });
      });
      await signInWithGoogle(idToken);
    } catch (error) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl border border-(--border) bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-(--teal)">{mode === "signup" ? "Create account" : "Sign in"}</h2>
          <button type="button" onClick={closeAuthModal} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleQfStart}
            className="h-11 w-full rounded-xl bg-(--teal) px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-70"
          >
            {mode === "signup" ? "Sign Up with Quran Foundation" : "Sign In with Quran Foundation"}
          </button>
          <p className="text-center text-sm text-slate-600">
            {mode === "signup" ? "Already signed in? " : "Don't have an account? "}
            <button
              type="button"
              onClick={mode === "signup" ? openSignIn : openSignUp}
              className="font-semibold text-(--teal) underline-offset-2 transition hover:underline"
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || !googleEnabled}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-(--border) bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={continueAsGuest}
          className="mt-3 h-11 w-full rounded-xl bg-(--peach-soft) text-sm font-semibold text-(--peach)"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
