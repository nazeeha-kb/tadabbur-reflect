"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_TAFSEER_SOURCE } from "@/lib/tafseerSources";

const UISettingsContext = createContext(null);

const UI_COPY = {
  navHome: "Home",
  navReflections: "My Reflections",
  navProgress: "Progress",
  languageLabel: "Language",
};

function getSavedTafseerSource() {
  if (typeof window === "undefined") return DEFAULT_TAFSEER_SOURCE;
  const stored = window.localStorage.getItem("ui-tafseer-source");
  return stored || DEFAULT_TAFSEER_SOURCE;
}

export function UISettingsProvider({ children }) {
  const [tafseerSource, setTafseerSource] = useState(DEFAULT_TAFSEER_SOURCE);

  useEffect(() => {
    setTafseerSource(getSavedTafseerSource());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ui-tafseer-source", tafseerSource);
  }, [tafseerSource]);

  const value = useMemo(
    () => ({
      tafseerSource,
      setTafseerSource,
      t(key) {
        return UI_COPY[key] || key;
      },
    }),
    [tafseerSource],
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
