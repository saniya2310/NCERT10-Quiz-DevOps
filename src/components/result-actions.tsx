"use client";

import { useEffect, useState } from "react";
import type { AttemptResult } from "@/lib/types";
import { deleteSavedResult, isResultSaved, saveResult } from "@/lib/saved-results";
import Link from "next/link";

type Props = {
  attempt: AttemptResult;
};

export function ResultActions({ attempt }: Props) {
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSaved(isResultSaved(attempt.id));
  }, [attempt.id]);

  function handleSave() {
    saveResult(attempt);
    setSaved(true);
    setMessage("Saved! You can review your score and explanations anytime under 'Saved Results'.");
    setTimeout(() => setMessage(null), 4000);
  }

  function handleUnsave() {
    deleteSavedResult(attempt.id);
    setSaved(false);
    setMessage("Removed from your saved results.");
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      // 1. Delete from local storage
      deleteSavedResult(attempt.id);
      // 2. Delete from server store
      await fetch(`/api/attempts/${attempt.id}`, { method: "DELETE" });
      setDeleted(true);
    } catch {
      setMessage("Failed to delete result. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (deleted) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-ink">
        <p className="font-display text-2xl text-rose-800">Quiz Result Deleted</p>
        <p className="mt-2 text-sm text-ink/75">
          This result, including your score and explanations, has been removed.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper hover:bg-ink/90"
          >
            Take Another Quiz
          </Link>
          <Link
            href="/results"
            className="rounded-full border border-ruled bg-white px-5 py-2 text-sm font-semibold hover:bg-ruled"
          >
            View Saved Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {saved ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              ✓ Saved in My Results
            </span>
            <button
              type="button"
              onClick={handleUnsave}
              className="text-xs text-ink/60 hover:text-ink hover:underline"
            >
              (Remove)
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            💾 Save Result & Explanations
          </button>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            🗑️ Delete Result
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-rose-800">Permanently delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-rose-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {message && (
        <p className="text-sm font-medium text-emerald-700 transition-all">{message}</p>
      )}
    </div>
  );
}
