"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUISettings } from "@/components/UISettingsProvider";
import { getTafseerSourceMeta, TAFSEER_SOURCES } from "@/lib/tafseerSources";
import { cn } from "@/lib/utils";

export default function TafseerSourceSelect({ className = "", compact = false }) {
  const { tafseerSource, setTafseerSource } = useUISettings();
  const selected = getTafseerSourceMeta(tafseerSource);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Select tafseer source"
          className={cn(
            "w-full justify-between gap-2 rounded-xl border-(--border) bg-white font-normal text-slate-800 shadow-sm",
            "hover:border-[#ccd6dc] hover:bg-white hover:text-slate-800",
            "focus-visible:border-[#b8c4cc] focus-visible:ring-2 focus-visible:ring-[rgba(215,222,227,0.85)]",
            compact ? "h-10 px-3 text-xs" : "h-11 px-4 text-sm",
            className,
          )}
        >
          <span className="truncate">{selected.label}</span>
          <ChevronDown
            className={cn("shrink-0 text-slate-500", compact ? "size-3.5" : "size-4")}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-(--border) bg-white p-1 text-slate-800 shadow-md ring-0"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-slate-500">
          Tafseer source
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-(--border)" />
        <DropdownMenuRadioGroup value={tafseerSource} onValueChange={setTafseerSource}>
          {TAFSEER_SOURCES.map((source) => (
            <DropdownMenuRadioItem
              key={source.id}
              value={source.id}
              className="rounded-lg text-slate-800 focus:bg-(--teal-soft) focus:text-slate-800 data-[state=checked]:font-medium"
            >
              {source.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
