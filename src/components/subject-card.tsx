import Link from "next/link";
import type { Subject } from "@/lib/types";

export function SubjectCard({ subject, chapters }: { subject: Subject; chapters: string[] }) {
  return (
    <article
      className="flex flex-col rounded-3xl bg-white p-5 shadow-sheet"
      style={{ borderTop: `6px solid ${subject.accent}` }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/50">{subject.short}</p>
      <h2 className="font-display mt-1 text-3xl">{subject.name}</h2>
      <p className="mt-2 flex-1 text-ink/75">{subject.blurb}</p>
      <p className="mt-3 text-sm text-ink/60">{chapters.length} chapters in this bank</p>
      <Link
        href={`/quiz/${subject.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
      >
        Start mixed quiz
      </Link>
    </article>
  );
}
