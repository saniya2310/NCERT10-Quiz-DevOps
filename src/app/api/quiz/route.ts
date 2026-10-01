import { NextRequest, NextResponse } from "next/server";
import { dailyQuiz, pickQuiz, toPublic } from "@/lib/bank";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subject") ?? "mathematics";
  const chapter = req.nextUrl.searchParams.get("chapter");
  const daily = req.nextUrl.searchParams.get("daily") === "1";
  const excludeParam = req.nextUrl.searchParams.get("exclude");
  const excludeIds = excludeParam ? excludeParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const questions = daily
    ? dailyQuiz(8, { excludeIds })
    : pickQuiz(subjectId, chapter, 8, { excludeIds });

  const res = NextResponse.json({
    subjectId: daily ? "daily" : subjectId,
    chapter: daily ? "Daily mix" : chapter ?? "mixed",
    questions: questions.map(toPublic),
  });

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res;
}
