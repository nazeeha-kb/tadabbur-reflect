"use client";

import TafseerSourceSelect from "@/components/TafseerSourceSelect";
import TafseerVisibilityToggle from "@/components/TafseerVisibilityToggle";
import { useUISettings } from "@/components/UISettingsProvider";
import { getTafseerSourceMeta } from "@/lib/tafseerSources";

export default function AyahTafseerBlock({ tafseer, className = "" }) {
  const { showTafseer, tafseerSource } = useUISettings();
  const text = tafseer?.trim();

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="md:flex-row flex flex-col md:items-center items-start md:justify-between w-full"> 
          <TafseerVisibilityToggle />
        {showTafseer ? <TafseerSourceSelect compact className="w-fit md:mt-0 mt-5" /> : null}
        </div>
       
      </div>
      {showTafseer && text ? (
        <div className="mt-6 rounded-xl border-l-4 border-(--teal) bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tafsir</p>
          <p className="mt-2 text-xs text-slate-500">
            Source: {getTafseerSourceMeta(tafseerSource).label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
        </div>
      ) : null}
    </div>
  );
}
