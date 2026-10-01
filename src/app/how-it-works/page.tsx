import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <article className="space-y-8 rounded-3xl bg-white p-6 shadow-sheet sm:p-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50">Student Guide</span>
        <h1 className="font-display mt-1 text-4xl sm:text-5xl">How BoardReady Works</h1>
        <p className="mt-2 text-lg text-ink/75">
          Your interactive preparation companion for Class 10 NCERT board exams.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl sm:text-3xl">How to Practice</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          <li className="rounded-2xl border border-ruled bg-paper/40 p-5">
            <span className="font-display text-2xl font-bold text-ink/40">01</span>
            <h3 className="mt-2 font-bold text-lg">Pick a Subject or Chapter</h3>
            <p className="mt-1 text-sm text-ink/70">
              Select Mathematics, Science, Social Science, or English. Practice either a mixed board-style set or target specific chapters you want to master.
            </p>
          </li>

          <li className="rounded-2xl border border-ruled bg-paper/40 p-5">
            <span className="font-display text-2xl font-bold text-ink/40">02</span>
            <h3 className="mt-2 font-bold text-lg">Dynamically Generated Sets</h3>
            <p className="mt-1 text-sm text-ink/70">
              Every quiz generates a fresh, unique set of questions from the NCERT syllabus, giving you endless fresh practice without repeating the same paper.
            </p>
          </li>

          <li className="rounded-2xl border border-ruled bg-paper/40 p-5">
            <span className="font-display text-2xl font-bold text-ink/40">03</span>
            <h3 className="mt-2 font-bold text-lg">Exam-Timed Practice</h3>
            <p className="mt-1 text-sm text-ink/70">
              Simulate actual exam time pressure with standard 45-second question timers, or switch to untimed study mode anytime in your Settings.
            </p>
          </li>

          <li className="rounded-2xl border border-ruled bg-paper/40 p-5">
            <span className="font-display text-2xl font-bold text-ink/40">04</span>
            <h3 className="mt-2 font-bold text-lg">Instant Scoring &amp; Explanations</h3>
            <p className="mt-1 text-sm text-ink/70">
              Submit your answers to get immediate marks, performance rankings, and comprehensive NCERT explanations for every question.
            </p>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-ruled bg-paper/40 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Saving &amp; Managing Your Quiz Results</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/75 sm:text-base">
          Exam revision is all about tracking your progress. After finishing any quiz, you can:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80 sm:text-base">
          <li>
            <strong>Save Quiz Results:</strong> Keep your final percentage, marks, and all question-by-question NCERT explanations safely in your Saved Results page.
          </li>
          <li>
            <strong>Review Anytime:</strong> Revisit past quizzes under{" "}
            <Link href="/results" className="font-semibold underline text-ink">
              Saved Results
            </Link>{" "}
            to study explanations and revise challenging concepts right before exams.
          </li>
          <li>
            <strong>Delete Whenever Needed:</strong> Permanently delete any individual quiz result or clear your history whenever you wish.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-highlight/40 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Student Customization &amp; Settings</h2>
        <p className="mt-2 text-sm text-ink/75 sm:text-base">
          Visit{" "}
          <Link href="/settings" className="font-semibold underline text-ink">
            Settings
          </Link>{" "}
          to customize your display name for the leaderboard, adjust timer speeds (30s, 45s, 60s, or untimed), toggle automatic result saving, and view your revision library.
        </p>
      </section>
    </article>
  );
}
