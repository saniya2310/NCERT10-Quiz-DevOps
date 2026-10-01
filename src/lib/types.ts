export type Difficulty = "easy" | "medium" | "hard";

export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  subjectId: string;
  chapter: string;
  ncertRef: string;
  difficulty: Difficulty;
  prompt: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  marks: number;
};

export type PublicQuestion = Omit<Question, "correctOptionId" | "explanation">;

export type Subject = {
  id: string;
  name: string;
  short: string;
  blurb: string;
  accent: string;
};

export type AttemptAnswer = {
  questionId: string;
  optionId: string | null;
};

export type ScoreBreakdown = {
  questionId: string;
  prompt?: string;
  options?: Option[];
  ncertRef?: string;
  chapter?: string;
  correct: boolean;
  correctOptionId: string;
  selectedOptionId: string | null;
  explanation: string;
  marksAwarded: number;
};

export type AttemptResult = {
  id: string;
  nickname: string;
  subjectId: string;
  subjectName?: string;
  chapter: string | null;
  daily: boolean;
  createdAt: string;
  totalMarks: number;
  scoredMarks: number;
  percent: number;
  durationSec: number;
  breakdown: ScoreBreakdown[];
};

export type LeaderboardEntry = {
  id: string;
  nickname: string;
  subjectId: string;
  percent: number;
  scoredMarks: number;
  totalMarks: number;
  createdAt: string;
};
