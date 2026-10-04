import { QuizPlayer } from "@/components/quiz-player";
import { dailyQuiz, toPublic, todayKey } from "@/lib/bank";


export default function DailyQuizPage() {
  const questions = dailyQuiz().map(toPublic);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/50">Daily Challenge</p>
        <h1 className="font-display text-3xl sm:text-4xl">Daily Practice Mix · {todayKey()}</h1>
        <p className="mt-1 text-sm text-ink/65">
          Dynamically generated set of 8 MCQs from across all Class 10 NCERT subjects.
        </p>
      </div>
      <QuizPlayer subjectId="daily" chapter="Daily mix" daily questions={questions} />
    </div>
  );
}
