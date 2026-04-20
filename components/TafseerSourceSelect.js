"use client";

import { useUISettings } from "@/components/UISettingsProvider";
import { TAFSEER_SOURCES } from "@/lib/tafseerSources";

export default function TafseerSourceSelect({ className = "", compact = false }) {
  const { tafseerSource, setTafseerSource } = useUISettings();

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      <select
        value={tafseerSource}
        onChange={(event) => setTafseerSource(event.target.value)}
        className={`focus-ring rounded-full border border-[var(--border)] bg-white text-slate-800 ${
          compact ? "h-10 px-3 text-xs" : "h-11 px-4 text-sm"
        }`}
        aria-label="Select tafseer source"
      >
        {TAFSEER_SOURCES.map((source) => (
          <option key={source.id} value={source.id}>
            {source.label}
          </option>
        ))}
      </select>
    </label>
  );
}
