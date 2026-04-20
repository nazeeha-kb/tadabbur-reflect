"use client";

import { useCallback, useRef, useState } from "react";
import MarkdownContent from "@/components/MarkdownContent";

function wrapSelection(value, selectionStart, selectionEnd, marker) {
  const selected = value.slice(selectionStart, selectionEnd);
  const next = `${value.slice(0, selectionStart)}${marker}${selected}${marker}${value.slice(selectionEnd)}`;
  return {
    next,
    selectionStart: selectionStart + marker.length,
    selectionEnd: selectionEnd + marker.length + selected.length,
  };
}

export default function RichReflectionEditor({ id, value, onChange, placeholder, rows = 10, createdAt, updatedAt }) {
  const textAreaRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const applyFormat = useCallback(
    (marker) => {
      const input = textAreaRef.current;
      if (!input) return;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const { next, selectionStart, selectionEnd } = wrapSelection(value, start, end, marker);
      onChange(next);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
      });
    },
    [onChange, value],
  );

  const onKeyDown = useCallback(
    (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "b") {
        event.preventDefault();
        applyFormat("**");
      }
      if (key === "i") {
        event.preventDefault();
        applyFormat("*");
      }
    },
    [applyFormat],
  );

  return (
    <div className="space-y-3">
      {/*
        Optional metadata display for created/updated timestamps.
        This section is intentionally disabled for the current editor experience.
      */}
      {!isEditing ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="focus-ring inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              aria-label="Edit"
              title="Click to edit"
            >
              ✎ Edit
            </button>
          </div>
          <div className="reflection-page bg-[linear-gradient(to_right,transparent_0,transparent_30px,hsl(0,70%,85%)_30px,hsl(0,70%,95%)_31px,transparent_31px),repeating-linear-gradient(to_bottom,transparent,transparent_27px,hsl(40,50%,85%)_28px)]">
            <MarkdownContent>{value || ""}</MarkdownContent>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyFormat("**")}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-400 bg-white px-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              aria-label="Bold"
              title="Bold (Ctrl/Cmd + B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyFormat("*")}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-400 bg-white px-2 text-sm italic text-slate-700 hover:bg-slate-50"
              aria-label="Italic"
              title="Italic (Ctrl/Cmd + I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="ml-auto inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-400 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              aria-label="Done"
              title="Done editing"
            >
              ✓ Done
            </button>
          </div>
          
          <textarea
            ref={textAreaRef}
            id={id}
            name={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={rows}
            className="reflection-page bg-[linear-gradient(to_right,transparent_0,transparent_30px,hsl(0,70%,85%)_30px,hsl(0,70%,95%)_31px,transparent_31px),repeating-linear-gradient(to_bottom,transparent,transparent_27px,hsl(40,50%,85%)_28px)] "
            placeholder={placeholder}
          />
        </>
      )}
    </div>
  );
}
