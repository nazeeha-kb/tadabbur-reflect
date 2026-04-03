"use client";

export default function ConfirmModal({ open, title, description, confirmLabel = "Delete", cancelLabel = "Cancel", onConfirm, onCancel, danger }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-xl">
        <h2 id="confirm-modal-title" className="font-serif text-xl text-slate-900">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:focus-ring"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition focus-visible:focus-ring ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[var(--teal)] hover:brightness-105"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
