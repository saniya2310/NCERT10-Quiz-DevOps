import type { PublicQuestion, Question, Subject } from "./types";
import mathematics from "@/data/questions/mathematics.json";
import science from "@/data/questions/science.json";
import socialScience from "@/data/questions/social-science.json";
import english from "@/data/questions/english.json";

export const SUBJECTS: Subject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    short: "Maths",
    blurb: "Real numbers to probability — one board-style MCQ at a time.",
    accent: "#2f6fed",
  },
  {
    id: "science",
    name: "Science",
    short: "Sci",
    blurb: "Reactions, life processes, electricity, and light from NCERT.",
    accent: "#1f7a4d",
  },
  {
    id: "social-science",
    name: "Social Science",
    short: "SST",
    blurb: "History, geography, civics, and economics in mixed sets.",
    accent: "#b45309",
  },
  {
    id: "english",
    name: "English",
    short: "Eng",
    blurb: "First Flight, Footprints, grammar, and reading inference.",
    accent: "#7c3aed",
  },
];

const BANKS: Record<string, Question[]> = {
  mathematics: mathematics as Question[],
  science: science as Question[],
  "social-science": socialScience as Question[],
  english: english as Question[],
};

export function allQuestions(): Question[] {
  return Object.values(BANKS).flat();
}

export function getSubject(id: string) {
  return SUBJECTS.find((s) => s.id === id);
}

export function questionsFor(subjectId: string, chapter?: string | null) {
  const pool = BANKS[subjectId] ?? [];
  if (!chapter || chapter === "mixed") return pool;
  return pool.filter((q) => q.chapter === chapter);
}

export function chaptersFor(subjectId: string) {
  return [...new Set(questionsFor(subjectId).map((q) => q.chapter))];
}

export function toPublic(q: Question): PublicQuestion {
  return {
    id: q.id,
    subjectId: q.subjectId,
    chapter: q.chapter,
    ncertRef: q.ncertRef,
    difficulty: q.difficulty,
    prompt: q.prompt,
    options: q.options,
    marks: q.marks,
  };
}

export function findQuestion(id: string) {
  return allQuestions().find((q) => q.id === id);
}

export function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let s = hashString(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function randomShuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type PickQuizOptions = {
  seed?: string;
  excludeIds?: string[];
};

export function pickQuiz(
  subjectId: string,
  chapter?: string | null,
  size = 8,
  optionsOrSeed?: string | PickQuizOptions,
) {
  const pool = questionsFor(subjectId, chapter);
  const options: PickQuizOptions =
    typeof optionsOrSeed === "string" ? { seed: optionsOrSeed } : optionsOrSeed ?? {};

  const excludeSet = new Set(options.excludeIds ?? []);
  const unseen = pool.filter((q) => !excludeSet.has(q.id));
  const seen = pool.filter((q) => excludeSet.has(q.id));

  const shuffleFn = options.seed
    ? (arr: Question[], sub: string) => seededShuffle(arr, `${options.seed}-${sub}`)
    : (arr: Question[]) => randomShuffle(arr);

  const shuffledUnseen = shuffleFn(unseen, "unseen");
  const shuffledSeen = shuffleFn(seen, "seen");
  const combined = [...shuffledUnseen, ...shuffledSeen];

  return combined.slice(0, Math.min(size, combined.length));
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailyQuiz(size = 8, options?: PickQuizOptions) {
  const pool = allQuestions();
  const excludeSet = new Set(options?.excludeIds ?? []);
  const unseen = pool.filter((q) => !excludeSet.has(q.id));
  const seen = pool.filter((q) => excludeSet.has(q.id));

  const shuffleFn = options?.seed
    ? (arr: Question[], sub: string) => seededShuffle(arr, `${options.seed}-${sub}`)
    : (arr: Question[]) => randomShuffle(arr);

  const shuffledUnseen = shuffleFn(unseen, "unseen");
  const shuffledSeen = shuffleFn(seen, "seen");
  const combined = [...shuffledUnseen, ...shuffledSeen];

  return combined.slice(0, Math.min(size, combined.length));
}
