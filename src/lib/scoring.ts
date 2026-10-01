import type { AttemptAnswer, Question, ScoreBreakdown } from "./types";

export function scoreAttempt(questions: Question[], answers: AttemptAnswer[]) {
  const byId = new Map(answers.map((a) => [a.questionId, a.optionId]));
  const breakdown: ScoreBreakdown[] = questions.map((q) => {
    const selected = byId.get(q.id) ?? null;
    const correct = selected === q.correctOptionId;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
      ncertRef: q.ncertRef,
      chapter: q.chapter,
      correct,
      correctOptionId: q.correctOptionId,
      selectedOptionId: selected,
      explanation: q.explanation,
      marksAwarded: correct ? q.marks : 0,
    };
  });
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const scoredMarks = breakdown.reduce((sum, row) => sum + row.marksAwarded, 0);
  const percent = totalMarks === 0 ? 0 : Math.round((scoredMarks / totalMarks) * 100);
  return { breakdown, totalMarks, scoredMarks, percent };
}

export function rankLabel(percent: number) {
  if (percent >= 90) return "Board-ready";
  if (percent >= 75) return "Strong";
  if (percent >= 50) return "Getting there";
  return "Revise once more";
}
