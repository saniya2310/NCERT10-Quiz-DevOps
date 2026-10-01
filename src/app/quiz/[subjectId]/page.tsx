import { QuizPlayer } from "@/components/quiz-player";
import { chaptersFor, getSubject, pickQuiz, toPublic } from "@/lib/bank";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { subjectId } = await params;
  const { chapter } = await searchParams;
  const subject = getSubject(subjectId);
  if (!subject) notFound();
  const questions = pickQuiz(subjectId, chapter ?? null).map(toPublic);
  const chapters = chaptersFor(subjectId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">{subject.name}</p>
        <h1 className="font-display text-3xl sm:text-4xl">{chapter ?? "Mixed Chapter Set"}</h1>
        <p className="mt-1 text-sm text-ink/65">
          Dynamic set of practice questions for Class 10 {subject.name}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/quiz/${subjectId}`}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            !chapter ? "bg-ink text-paper" : "bg-white shadow-sm hover:bg-paper"
          }`}
        >
          Mixed Set
        </Link>
        {chapters.map((name) => (
          <Link
            key={name}
            href={`/quiz/${subjectId}?chapter=${encodeURIComponent(name)}`}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              chapter === name ? "bg-ink text-paper" : "bg-white shadow-sm hover:bg-paper"
            }`}
          >
            {name}
          </Link>
        ))}
      </div>
      <QuizPlayer subjectId={subjectId} chapter={chapter ?? null} questions={questions} />
    </div>
  );
}
