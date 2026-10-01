import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ncert10-quiz",
    time: new Date().toISOString(),
  });
}
