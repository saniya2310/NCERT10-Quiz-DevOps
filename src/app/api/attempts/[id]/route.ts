import { NextResponse } from "next/server";
import { deleteAttempt, getAttempt } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = getAttempt(id);
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(attempt);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteAttempt(id);
  if (!deleted) {
    return NextResponse.json({ error: "Attempt not found or already deleted" }, { status: 404 });
  }
  return NextResponse.json({ success: true, id });
}
