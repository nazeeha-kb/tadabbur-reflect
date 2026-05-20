"use client";

import TafseerSourceSelect from "@/components/TafseerSourceSelect";
import TafseerVisibilityToggle from "@/components/TafseerVisibilityToggle";
import { useUISettings } from "@/components/UISettingsProvider";
import { getTafseerSourceMeta } from "@/lib/tafseerSources";

export default function AyahTafseerBlock({ tafseer, className = "" }) {
  const { showTafseer, tafseerSource } = useUISettings();
  const text = getTafseerText(tafseer);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="md:flex-row flex flex-col md:items-center items-start md:justify-between w-full"> 
          <TafseerVisibilityToggle />
        {showTafseer ? <TafseerSourceSelect compact className="w-fit md:mt-0 mt-5" /> : null}
        </div>
       
      </div>
      {showTafseer && text ? (
        <div className="mt-6 rounded-xl border border-green-300 bg-green-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Tafsir</p>
          <p className="mt-2 text-xs text-green-700">
            Source: {getTafseerSourceMeta(tafseerSource).label}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-slate-800">{text}</p>
        </div>
      ) : null}
    </div>
  );
}

function getTafseerText(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const text = value.text || value.tafseer || value.tafsir;
    return typeof text === "string" ? text.trim() : "";
  }
  return "";
}
