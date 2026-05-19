"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function useRequireAuth({ fallbackRedirect = "/" } = {}) {
  const { authReady, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(fallbackRedirect);
    }
  }, [authReady, fallbackRedirect, router, user]);

  return {
    authReady,
    isAuthenticated: Boolean(user),
    isGuest: user?.kind === "guest",
  };
}

export default function AuthGuard({ children, fallbackRedirect = "/" }) {
  const { authReady } = useRequireAuth({ fallbackRedirect });
  if (!authReady) {
    return null;
  }
  return <>{children}</>;
}
