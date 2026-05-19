import React from "react";

export default function SyncStatusBadge({ status }) {
  const s = status || "local";
  let label = "Local";
  let bg = "bg-gray-100 text-gray-700";

  if (s === "synced") {
    label = "Synced";
    bg = "bg-emerald-100 text-emerald-800";
  } else if (s === "syncing") {
    label = "Syncing";
    bg = "bg-yellow-100 text-yellow-800";
  } else if (s === "failed") {
    label = "Failed";
    bg = "bg-rose-100 text-rose-800";
  } else if (s === "local") {
    label = "Local";
    bg = "bg-slate-100 text-slate-700";
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 h-fit text-xs font-semibold ${bg}`}>
      {s === "syncing" ? (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : s === "synced" ? (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : s === "failed" ? (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
