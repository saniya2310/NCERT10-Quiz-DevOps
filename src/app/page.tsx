import { NicknameField } from "@/components/nickname-field";
import { SubjectCard } from "@/components/subject-card";
import { SUBJECTS, chaptersFor, todayKey } from "@/lib/bank";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white/90 p-6 shadow-sheet sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-highlight px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">
            CBSE Class 10 NCERT
          </span>
          <span className="text-xs font-semibold text-ink/50">· Dynamic MCQ Practice</span>
        </div>

        <h1 className="font-display mt-3 max-w-2xl text-4xl leading-tight sm:text-6xl">
          Master your board syllabus with dynamic quizzes.
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/75">
          Every quiz generates a unique set of NCERT questions with instant scoring, chapter-wise
          explanations, and the option to save your results for revision before exams.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4 sm:gap-6">
          <NicknameField />
          <Link
            href="/quiz/daily"
            className="rounded-full bg-highlight px-5 py-3 font-semibold text-ink transition hover:bg-highlight/80"
          >
            Today&apos;s dynamic mix · {todayKey()}
          </Link>
          <Link
            href="/results"
            className="rounded-full border border-ruled bg-white px-5 py-3 font-semibold text-ink transition hover:bg-paper"
          >
            📋 Saved results
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl sm:text-3xl">Select a Subject to Practice</h2>
          <span className="text-xs font-semibold text-ink/50">Dynamic NCERT sets</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} chapters={chaptersFor(subject.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}
