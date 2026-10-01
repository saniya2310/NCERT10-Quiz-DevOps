import { ShareBar } from "@/components/share-bar";
import { ResultActions } from "@/components/result-actions";
import { getSubject, findQuestion } from "@/lib/bank";
import { appUrl } from "@/lib/share";
import { rankLabel } from "@/lib/scoring";
import { getAttempt } from "@/lib/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const attempt = getAttempt(id);
  if (!attempt) return { title: "Result" };
  return {
    title: `${attempt.percent}% for ${attempt.nickname}`,
    description: `${attempt.nickname} scored ${attempt.percent}% on BoardReady.`,
    openGraph: {
      title: `${attempt.nickname} scored ${attempt.percent}%`,
      description: "Class 10 NCERT quiz on BoardReady",
      url: `${appUrl()}/results/${id}`,
    },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const attempt = getAttempt(id);
  if (!attempt) notFound();
  const subject = getSubject(attempt.subjectId);
  const subjectName = subject?.name ?? (attempt.daily ? "Daily mix" : attempt.subjectId);
  const url = `${appUrl()}/results/${id}`;

  const retryHref = attempt.daily ? `/quiz/daily?r=${Date.now()}` : `/quiz/${attempt.subjectId}?r=${Date.now()}`;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sheet sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">Instant Score Report</p>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/70">
            {new Date(attempt.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-4">
          <h1 className="font-display text-5xl sm:text-6xl">{attempt.percent}%</h1>
          <span className="rounded-full bg-highlight px-3.5 py-1 text-sm font-bold text-ink">
            {rankLabel(attempt.percent)}
          </span>
        </div>

        <p className="mt-3 text-lg font-medium text-ink">
          {attempt.scoredMarks} of {attempt.totalMarks} marks scored · {attempt.nickname}
        </p>

        <p className="mt-1 text-sm text-ink/65">
          {subjectName}
          {attempt.chapter ? ` · ${attempt.chapter}` : ""} · Completed in {attempt.durationSec}s
        </p>

        <div className="mt-6 border-t border-ruled pt-6">
          <ResultActions attempt={attempt} />
        </div>

        <div className="mt-6 border-t border-ruled pt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/50">Share Your Achievement</p>
          <ShareBar nickname={attempt.nickname} percent={attempt.percent} subject={subjectName} url={url} />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-ruled pt-6 text-sm font-semibold">
          <Link
            href={retryHref}
            className="rounded-full bg-ink px-4 py-2 text-paper transition hover:bg-ink/90"
          >
            🔄 Take Another Quiz (Unique Questions)
          </Link>
          <Link
            href="/results"
            className="rounded-full border border-ruled bg-white px-4 py-2 text-ink hover:bg-ruled"
          >
            📋 Saved Results
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-ruled bg-white px-4 py-2 text-ink hover:bg-ruled"
          >
            🏆 Leaderboard
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-3xl">Question Explanations & Review</h2>
          <p className="text-sm text-ink/65">
            Detailed NCERT explanations for every question to help you revise and strengthen concepts.
          </p>
        </div>

        <div className="space-y-4">
          {attempt.breakdown.map((row, i) => {
            const question = findQuestion(row.questionId);
            const prompt = row.prompt || question?.prompt || "Question";
            const explanation = row.explanation || question?.explanation || "";
            const ncertRef = row.ncertRef || question?.ncertRef;
            const options = row.options || question?.options || [];

            return (
              <article key={row.questionId} className="rounded-2xl bg-white p-5 shadow-sheet sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold">Question {i + 1}</span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      row.correct ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {row.correct ? "✓ Correct (+1 Mark)" : "✗ Needs Revision (0 Marks)"}
                  </span>
                </div>

                {ncertRef && (
                  <p className="mt-1 text-xs font-semibold text-ink/50 uppercase tracking-wider">{ncertRef}</p>
                )}

                <p className="mt-3 text-lg font-medium text-ink">{prompt}</p>

                {options.length > 0 && (
                  <ul className="mt-4 grid gap-2">
                    {options.map((opt) => {
                      const isCorrect = opt.id === row.correctOptionId;
                      const isSelected = opt.id === row.selectedOptionId;
                      let style = "border-ruled bg-paper/50 text-ink/80";
                      if (isCorrect) {
                        style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
                      } else if (isSelected && !isCorrect) {
                        style = "border-rose-300 bg-rose-50 text-rose-900 line-through";
                      }

                      return (
                        <li
                          key={opt.id}
                          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm ${style}`}
                        >
                          <div>
                            <span className="mr-2 font-bold uppercase">{opt.id}.</span>
                            {opt.text}
                          </div>
                          {isCorrect && (
                            <span className="text-xs font-bold text-emerald-700 uppercase">Correct Answer</span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="text-xs font-bold text-rose-700 uppercase">Your Pick</span>
                          )}
                          {isSelected && isCorrect && (
                            <span className="text-xs font-bold text-emerald-700 uppercase">Your Pick ✓</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-4 rounded-xl border border-ruled bg-paper/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/60">NCERT Explanation</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/85">{explanation}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
