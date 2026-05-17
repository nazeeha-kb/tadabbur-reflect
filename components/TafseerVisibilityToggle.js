"use client";

import { useUISettings } from "@/components/UISettingsProvider";

export default function TafseerVisibilityToggle({ className = "", compact = false }) {
  const { showTafseer, setShowTafseer } = useUISettings();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={compact ? "text-xs font-medium text-slate-600" : "text-xs font-semibold uppercase tracking-wide text-slate-500"}>
        {compact ? "Tafseer" : "Show tafseer"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showTafseer}
        aria-label={showTafseer ? "Hide tafseer" : "Show tafseer"}
        onClick={() => setShowTafseer((prev) => !prev)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--teal) ${
          showTafseer ? "bg-(--teal)" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            showTafseer ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
