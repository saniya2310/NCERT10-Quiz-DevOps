import { NextRequest, NextResponse } from "next/server";
import { findQuestion, getSubject } from "@/lib/bank";
import { scoreAttempt } from "@/lib/scoring";
import { saveAttempt } from "@/lib/store";
import type { AttemptAnswer, Question } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nickname = String(body.nickname ?? "Student").trim().slice(0, 24) || "Student";
  const subjectId = String(body.subjectId ?? "mathematics");
  const chapter = body.chapter ? String(body.chapter) : null;
  const durationSec = Number(body.durationSec ?? 0);
  const answers = (body.answers ?? []) as AttemptAnswer[];
  const ids = answers.map((a) => a.questionId);
  const questions = ids
    .map(findQuestion)
    .filter((question): question is Question => Boolean(question));

  if (questions.length === 0) {
    return NextResponse.json({ error: "No valid questions" }, { status: 400 });
  }

  const scored = scoreAttempt(questions, answers);
  const subject = getSubject(subjectId);
  const result = saveAttempt({
    id: crypto.randomUUID(),
    nickname,
    subjectId,
    subjectName: subject?.name ?? (body.daily ? "Daily mix" : subjectId),
    chapter,
    daily: Boolean(body.daily),
    createdAt: new Date().toISOString(),
    durationSec,
    ...scored,
  });

  return NextResponse.json(result);
}
