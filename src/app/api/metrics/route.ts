import { NextResponse } from "next/server";
import { questionsFor, SUBJECTS } from "@/lib/bank";
import { getStoreStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const stats = getStoreStats();

  const lines: string[] = [];

  // Metadata & System
  lines.push("# HELP process_uptime_seconds The number of seconds the process has been running.");
  lines.push("# TYPE process_uptime_seconds gauge");
  lines.push(`process_uptime_seconds ${uptime.toFixed(2)}`);

  lines.push("# HELP nodejs_heap_size_total_bytes Process total heap memory in bytes.");
  lines.push("# TYPE nodejs_heap_size_total_bytes gauge");
  lines.push(`nodejs_heap_size_total_bytes ${mem.heapTotal}`);

  lines.push("# HELP nodejs_heap_size_used_bytes Process used heap memory in bytes.");
  lines.push("# TYPE nodejs_heap_size_used_bytes gauge");
  lines.push(`nodejs_heap_size_used_bytes ${mem.heapUsed}`);

  lines.push("# HELP nodejs_resident_memory_bytes Resident memory size in bytes.");
  lines.push("# TYPE nodejs_resident_memory_bytes gauge");
  lines.push(`nodejs_resident_memory_bytes ${mem.rss}`);

  // Application Metrics
  lines.push("# HELP ncert10_quiz_healthy Indicates if application health probe is passing.");
  lines.push("# TYPE ncert10_quiz_healthy gauge");
  lines.push("ncert10_quiz_healthy 1");

  lines.push("# HELP ncert10_quiz_questions_total Total NCERT questions available by subject.");
  lines.push("# TYPE ncert10_quiz_questions_total gauge");
  for (const s of SUBJECTS) {
    const count = questionsFor(s.id).length;
    lines.push(`ncert10_quiz_questions_total{subject="${s.id}",subject_name="${s.name}"} ${count}`);
  }

  lines.push("# HELP ncert10_quiz_attempts_total Total quiz attempts recorded on server.");
  lines.push("# TYPE ncert10_quiz_attempts_total counter");
  lines.push(`ncert10_quiz_attempts_total ${stats.totalAttempts}`);

  lines.push("# HELP ncert10_quiz_leaderboard_entries_total Total entries on global leaderboard.");
  lines.push("# TYPE ncert10_quiz_leaderboard_entries_total gauge");
  lines.push(`ncert10_quiz_leaderboard_entries_total ${stats.leaderboardEntries}`);

  lines.push("# HELP ncert10_quiz_average_score_percent Average score percentage across recorded attempts.");
  lines.push("# TYPE ncert10_quiz_average_score_percent gauge");
  lines.push(`ncert10_quiz_average_score_percent ${stats.averageScorePercent}`);

  // Trailing newline required by Prometheus exposition format
  const body = lines.join("\n") + "\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
