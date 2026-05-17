"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_TAFSEER_SOURCE } from "@/lib/tafseerSources";

const UISettingsContext = createContext(null);

const UI_COPY = {
  navHome: "Home",
  navReflections: "My Reflections",
  navDashboard: "Dashboard",
  languageLabel: "Language",
};

const SHOW_TAFSEER_KEY = "ui-show-tafseer";

function getSavedTafseerSource() {
  if (typeof window === "undefined") return DEFAULT_TAFSEER_SOURCE;
  const stored = window.localStorage.getItem("ui-tafseer-source");
  return stored || DEFAULT_TAFSEER_SOURCE;
}

function getSavedShowTafseer() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SHOW_TAFSEER_KEY) !== "0";
}

export function UISettingsProvider({ children }) {
  const [tafseerSource, setTafseerSource] = useState(DEFAULT_TAFSEER_SOURCE);
  const [showTafseer, setShowTafseerState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTafseerSource(getSavedTafseerSource());
    setShowTafseerState(getSavedShowTafseer());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem("ui-tafseer-source", tafseerSource);
  }, [tafseerSource, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(SHOW_TAFSEER_KEY, showTafseer ? "1" : "0");
  }, [showTafseer, hydrated]);

  const setShowTafseer = useCallback((next) => {
    setShowTafseerState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const value = useMemo(
    () => ({
      tafseerSource,
      setTafseerSource,
      showTafseer,
      setShowTafseer,
      t(key) {
        return UI_COPY[key] || key;
      },
    }),
    [tafseerSource, showTafseer, setShowTafseer],
  );

  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error("useUISettings must be used within UISettingsProvider");
  }
  return context;
}
