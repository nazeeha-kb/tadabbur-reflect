"use client";

import { useState } from "react";

export default function TagInput({ id, tags, onChange, placeholder = "Add a tag, press Enter" }) {
  const [draft, setDraft] = useState("");

  const commit = (raw) => {
    const parts = raw
      .split(/[,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = [...new Set([...tags, ...parts])];
    onChange(merged);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    }
    if (e.key === "," && draft.trim()) {
      e.preventDefault();
      commit(draft);
    }
    if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected tags">
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="ml-0.5 rounded-full p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commit(draft);
        }}
        className="focus-ring w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
