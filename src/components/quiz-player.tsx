"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicQuestion } from "@/lib/types";
import { useNickname } from "./nickname-field";
import { getStudentSettings } from "@/lib/student-settings";
import { saveResult } from "@/lib/saved-results";

type Props = {
  subjectId: string;
  chapter: string | null;
  daily?: boolean;
  questions: PublicQuestion[];
};

export function QuizPlayer({ subjectId, chapter, daily, questions: initialQuestions }: Props) {
  const router = useRouter();
  const { nickname } = useNickname();
  const [questions, setQuestions] = useState<PublicQuestion[]>(initialQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [started] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Student settings
  const [settings, setSettings] = useState(() => getStudentSettings());

  useEffect(() => {
    setSettings(getStudentSettings());
    const handler = () => setSettings(getStudentSettings());
    window.addEventListener("boardready-settings-change", handler);
    return () => window.removeEventListener("boardready-settings-change", handler);
  }, []);

  const timerMax = settings.timerDurationSec; // 0 = untimed
  const [secondsLeft, setSecondsLeft] = useState(timerMax > 0 ? timerMax : 0);

  const question = questions[index];
  const doneCount = Object.keys(answers).length;

  // Sync questions prop if initialQuestions change
  useEffect(() => {
    setQuestions(initialQuestions);
    setIndex(0);
    setSelected(null);
    setAnswers({});
  }, [initialQuestions]);

  useEffect(() => {
    if (!question) return;
    if (timerMax > 0) {
      setSecondsLeft(timerMax);
    }
    setSelected(answers[question.id] ?? null);
    // Changing an option should not reset the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, question?.id, timerMax]);

  useEffect(() => {
    if (timerMax <= 0) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [index, timerMax]);

  useEffect(() => {
    if (!question || timerMax <= 0) return;
    if (secondsLeft === 0 && selected === null && answers[question.id] === undefined) {
      setAnswers((prev) => ({ ...prev, [question.id]: null }));
    }
  }, [secondsLeft, selected, answers, question, timerMax]);

  const progress = useMemo(
    () => ((index + (selected ? 1 : 0)) / (questions.length || 1)) * 100,
    [index, questions.length, selected],
  );

  async function generateNewQuestions() {
    setGenerating(true);
    setError(null);
    try {
      let exclude: string[] = [];
      try {
        const raw = sessionStorage.getItem("boardready-recent-ids");
        if (raw) exclude = JSON.parse(raw);
      } catch {}
      const params = new URLSearchParams();
      if (daily) {
        params.set("daily", "1");
      } else {
        params.set("subject", subjectId);
        if (chapter && chapter !== "Mixed chapter set") {
          params.set("chapter", chapter);
        }
      }
      if (exclude.length > 0) {
        params.set("exclude", exclude.slice(0, 20).join(","));
      }
      params.set("t", Date.now().toString());

      const res = await fetch(`/api/quiz?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load new questions");
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        setIndex(0);
        setSelected(null);
        setAnswers({});
        if (timerMax > 0) setSecondsLeft(timerMax);
      }
    } catch {
      setError("Could not generate a new question set. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (!question) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sheet">
        <p className="text-lg font-semibold">No questions found for this set.</p>
        <button
          type="button"
          onClick={generateNewQuestions}
          disabled={generating}
          className="mt-4 rounded-full bg-ink px-5 py-2 font-semibold text-paper"
        >
          {generating ? "Generating..." : "Generate New Questions"}
        </button>
      </div>
    );
  }

  function lockAnswer(optionId: string | null) {
    if (!question) return;
    setSelected(optionId);
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  async function finish(nextAnswers: Record<string, string | null>) {
    setBusy(true);
    setError(null);
    const payload = {
      nickname: settings.nickname || nickname,
      subjectId: daily ? "daily" : subjectId,
      chapter,
      daily: Boolean(daily),
      durationSec: Math.round((Date.now() - started) / 1000),
      answers: questions.map((q) => ({
        questionId: q.id,
        optionId: nextAnswers[q.id] ?? null,
      })),
    };

    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setBusy(false);
        setError("Could not score this attempt. Try again.");
        return;
      }

      const data = await res.json();

      // Remember recently answered questions so consecutive quizzes generate unique questions
      try {
        const raw = sessionStorage.getItem("boardready-recent-ids");
        const existing: string[] = raw ? JSON.parse(raw) : [];
        const nextIds = [...questions.map((q) => q.id), ...existing].slice(0, 40);
        sessionStorage.setItem("boardready-recent-ids", JSON.stringify(nextIds));
      } catch {}

      // If student has auto-save enabled in settings, save to student's saved results
      if (settings.autoSaveResults) {
        saveResult(data);
      }

      router.push(`/results/${data.id}`);
    } catch {
      setBusy(false);
      setError("Network error while scoring. Please try again.");
    }
  }

  function next() {
    const current = { ...answers, [question.id]: selected };
    setAnswers(current);
    if (index === questions.length - 1) {
      void finish(current);
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sheet">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-ink/40">·</span>
          <span className="text-ink/70">{doneCount} answered</span>
        </div>

        <div className="flex items-center gap-3">
          {timerMax > 0 ? (
            <span
              className={`rounded-full px-3 py-1 font-mono font-bold ${
                secondsLeft < 10 ? "bg-rose-100 text-rose-700" : "bg-paper text-ink"
              }`}
            >
              ⏱️ {secondsLeft}s left
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              🌿 Untimed Study Mode
            </span>
          )}

          {index === 0 && (
            <button
              type="button"
              onClick={generateNewQuestions}
              disabled={generating || busy}
              className="rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-ink transition hover:bg-highlight/80 disabled:opacity-50"
              title="Generate a fresh, unique set of questions"
            >
              {generating ? "Generating…" : "🔄 New Set"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-ruled" aria-hidden>
        <div className="h-full bg-ink transition-all" style={{ width: `${progress}%` }} />
      </div>

      {settings.showNcertReferences && question.ncertRef && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/50">
          {question.ncertRef}
        </p>
      )}

      <h2 className="font-display mt-2 text-2xl leading-snug sm:text-3xl">{question.prompt}</h2>

      <ul className="mt-6 grid gap-3">
        {question.options.map((option) => {
          const active = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => lockAnswer(option.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-lg transition ${
                  active ? "border-ink bg-highlight font-medium shadow-sm" : "border-ruled bg-paper/70 hover:border-ink/40"
                }`}
              >
                <span className="mr-2 font-bold uppercase">{option.id}.</span>
                {option.text}
              </button>
            </li>
          );
        })}
      </ul>

      {error ? <p className="mt-4 text-sm font-semibold text-wrong">{error}</p> : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={next}
            disabled={busy}
            className="rounded-full bg-ink px-6 py-2.5 font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
          >
            {index === questions.length - 1 ? (busy ? "Scoring…" : "Submit & Score") : "Next Question"}
          </button>
          <button
            type="button"
            onClick={() => lockAnswer(null)}
            className="rounded-full px-4 py-2.5 font-semibold text-ink/75 hover:bg-ruled"
          >
            Skip for now
          </button>
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="text-sm font-semibold text-ink/60 hover:text-ink hover:underline"
          >
            ← Previous Question
          </button>
        )}
      </div>
    </section>
  );
}
