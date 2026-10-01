import { NextResponse } from "next/server";
import { SUBJECTS, chaptersFor } from "@/lib/bank";

export async function GET() {
  return NextResponse.json(
    SUBJECTS.map((s) => ({ ...s, chapters: chaptersFor(s.id) })),
  );
}
