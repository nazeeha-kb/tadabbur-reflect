"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useUISettings } from "@/components/UISettingsProvider";
import { getReflectionSearchQuery } from "@/lib/reflections/searchQuery";
import { navigateToReflectSearch } from "@/lib/navigation/reflectNav";
import { searchDebug } from "@/lib/search/searchDebug";

export default function ReflectionSearchLink({
  reflection,
  className = "",
  children,
  as: Component = "button",
  disabled: disabledProp = false,
}) {
  const router = useRouter();
  const { tafseerSource } = useUISettings();
  const { isAuthenticated, openSignIn, trackActivity } = useAuth();

  const query = getReflectionSearchQuery(reflection);
  const hasQuery = Boolean(query);
  const disabled = disabledProp || !hasQuery;

  function handleRerun(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!hasQuery) {
      toast.error("No saved search for this reflection.");
      return;
    }

    if (!isAuthenticated) {
      openSignIn();
      toast.message("Please sign in, sign up, or continue as guest.");
      return;
    }

    searchDebug("reflectionLink.click", { query });
    const tafseer = reflection?.tafseerSource?.trim() || tafseerSource;
    navigateToReflectSearch(router, { query, tafseerSource: tafseer });
    void trackActivity();
  }

  if (!hasQuery) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      onClick={handleRerun}
      disabled={disabled}
      title={`Search again for "${query}"`}
      className={`w-full cursor-pointer text-left transition hover:opacity-90 focus-visible:focus-ring disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </Component>
  );
}
