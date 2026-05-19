import React from "react";
import SyncStatusBadge from "./SyncStatusBadge";

export default function SyncLegend() {
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="text-xs text-slate-600">Sync legend:</span>
      <div className="flex items-center gap-2">
        <SyncStatusBadge status="synced" />
        <span className="text-xs text-slate-600">Saved to cloud</span>
      </div>
      <div className="flex items-center gap-2">
        <SyncStatusBadge status="syncing" />
        <span className="text-xs text-slate-600">Syncing</span>
      </div>
      <div className="flex items-center gap-2">
        <SyncStatusBadge status="local" />
        <span className="text-xs text-slate-600">Local only (guest)</span>
      </div>
      <div className="flex items-center gap-2">
        <SyncStatusBadge status="failed" />
        <span className="text-xs text-slate-600">Retrying in background</span>
      </div>
    </div>
  );
}
