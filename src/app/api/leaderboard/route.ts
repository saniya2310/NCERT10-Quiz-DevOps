import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/store";

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject") ?? undefined;
  const entries = await getLeaderboard(subject ?? undefined);
  return NextResponse.json(entries);
}
