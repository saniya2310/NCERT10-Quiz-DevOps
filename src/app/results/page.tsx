"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { AttemptResult } from "@/lib/types";
import { clearAllSavedResults, deleteSavedResult, getSavedResults, onSavedResultsChange } from "@/lib/saved-results";
import { rankLabel } from "@/lib/scoring";
import { SUBJECTS } from "@/lib/bank";

export default function SavedResultsPage() {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setResults(getSavedResults());
    return onSavedResultsChange(() => {
      setResults(getSavedResults());
    });
  }, []);

  const filteredResults = useMemo(() => {
    if (activeSubject === "all") return results;
    return results.filter((r) => r.subjectId === activeSubject);
  }, [results, activeSubject]);

  const stats = useMemo(() => {
    if (results.length === 0) return { count: 0, avg: 0, best: 0 };
    const count = results.length;
    const avg = Math.round(results.reduce((acc, r) => acc + r.percent, 0) / count);
    const best = Math.max(...results.map((r) => r.percent));
    return { count, avg, best };
  }, [results]);

  async function handleDelete(id: string) {
    deleteSavedResult(id);
    setDeleteConfirmId(null);
    try {
      await fetch(`/api/attempts/${id}`, { method: "DELETE" });
    } catch {}
  }

  function handleClearAll() {
    clearAllSavedResults();
    setConfirmClearAll(false);
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl sm:text-5xl">Saved Quiz Results</h1>
        <p className="text-ink/65">Loading saved quiz results…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Saved Quiz Results</h1>
          <p className="mt-2 text-ink/75">
            Your saved quiz scores and detailed question explanations for future board exam revision.
          </p>
        </div>

        {results.length > 0 && (
          <div>
            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                🗑️ Clear All Saved Results
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-2">
                <span className="text-xs font-semibold text-rose-800">Clear all saved?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-rose-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <section className="grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 shadow-sheet sm:gap-6 sm:p-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Saved Quizzes</p>
            <p className="font-display mt-1 text-2xl sm:text-4xl">{stats.count}</p>
          </div>
          <div className="border-x border-ruled text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Average Score</p>
            <p className="font-display mt-1 text-2xl sm:text-4xl text-amber-700">{stats.avg}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50">Best Score</p>
            <p className="font-display mt-1 text-2xl sm:text-4xl text-emerald-700">{stats.best}%</p>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubject("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeSubject === "all" ? "bg-ink text-paper" : "bg-white shadow-sm hover:bg-paper"
            }`}
          >
            All ({results.length})
          </button>
          {SUBJECTS.map((s) => {
            const count = results.filter((r) => r.subjectId === s.id).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSubject(s.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  activeSubject === s.id ? "bg-ink text-paper" : "bg-white shadow-sm hover:bg-paper"
                }`}
              >
                {s.short} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filteredResults.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sheet sm:p-12">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-paper text-2xl">
            📚
          </div>
          <h2 className="font-display text-2xl sm:text-3xl">No Saved Quiz Results Yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/70 sm:text-base">
            Whenever you complete a quiz, click &ldquo;Save Result &amp; Explanations&rdquo; to save your score and
            question explanations here for future access and revision.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90"
            >
              Start a Practice Quiz
            </Link>
            <Link
              href="/quiz/daily"
              className="rounded-full bg-highlight px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-highlight/80"
            >
              Today&apos;s Dynamic Mix
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((attempt) => {
            const isExpanded = expandedId === attempt.id;
            const subject = SUBJECTS.find((s) => s.id === attempt.subjectId);
            const subjectName = subject?.name ?? (attempt.daily ? "Daily mix" : attempt.subjectId);

            return (
              <article
                key={attempt.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sheet transition hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-paper px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-ink/70">
                          {subjectName}
                        </span>
                        {attempt.chapter && (
                          <span className="text-xs font-semibold text-ink/60">· {attempt.chapter}</span>
                        )}
                      </div>
                      <h3 className="font-display mt-2 text-2xl font-bold">
                        {attempt.percent}% Score
                        <span className="ml-2 text-sm font-normal text-ink/65">
                          ({attempt.scoredMarks}/{attempt.totalMarks} marks)
                        </span>
                      </h3>
                      <p className="mt-1 text-xs text-ink/50">
                        Taken on{" "}
                        {new Date(attempt.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · Duration: {attempt.durationSec}s · {attempt.nickname}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-highlight px-3 py-1 text-xs font-bold text-ink">
                        {rankLabel(attempt.percent)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                        className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper hover:bg-ink/90"
                      >
                        {isExpanded ? "Hide Explanations ▲" : "View Explanations ▼"}
                      </button>

                      {deleteConfirmId !== attempt.id ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(attempt.id)}
                          className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2 py-1">
                          <span className="text-xs font-semibold text-rose-800">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(attempt.id)}
                            className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-rose-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-ink/60 hover:bg-rose-100"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Question Explanations */}
                {isExpanded && (
                  <div className="border-t border-ruled bg-paper/30 p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-xl font-bold">
                        Detailed Question Explanations &amp; Answers
                      </h4>
                      <Link
                        href={`/results/${attempt.id}`}
                        className="text-xs font-semibold text-ink underline hover:text-ink/80"
                      >
                        Open full result report page →
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {attempt.breakdown.map((row, i) => (
                        <div
                          key={row.questionId || i}
                          className="rounded-2xl border border-ruled bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-sm">Question {i + 1}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                row.correct
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {row.correct ? "✓ Correct" : "✗ Needs revision"}
                            </span>
                          </div>

                          {row.ncertRef && (
                            <p className="mt-1 text-xs font-semibold text-ink/50 uppercase tracking-wider">
                              {row.ncertRef}
                            </p>
                          )}

                          {row.prompt && <p className="mt-2 font-medium text-ink">{row.prompt}</p>}

                          <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-paper px-2.5 py-1 text-ink/75">
                              Your answer:{" "}
                              <strong className="uppercase">
                                {row.selectedOptionId ?? "Skipped"}
                              </strong>
                            </span>
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                              Correct answer:{" "}
                              <strong className="uppercase">{row.correctOptionId}</strong>
                            </span>
                          </div>

                          {row.explanation && (
                            <div className="mt-3 rounded-xl bg-paper/60 p-3 text-xs leading-relaxed text-ink/85">
                              <span className="block font-bold uppercase tracking-wider text-ink/60">
                                NCERT Explanation
                              </span>
                              {row.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
