import { getLeaderboard } from "@/lib/store";
import { SUBJECTS } from "@/lib/bank";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const rows = getLeaderboard(subject);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-5xl">Leaderboard</h1>
      <p className="max-w-xl text-ink/70">
        Ranked by percentage, then marks. Scores are calculated on the server so the table stays honest.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/leaderboard" className={`rounded-full px-3 py-1 text-sm font-semibold ${!subject ? "bg-ink text-paper" : "bg-white shadow"}`}>
          All
        </Link>
        {SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/leaderboard?subject=${s.id}`}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              subject === s.id ? "bg-ink text-paper" : "bg-white shadow"
            }`}
          >
            {s.short}
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-sheet">
        <table className="w-full text-left">
          <thead className="bg-paper text-sm uppercase tracking-wider text-ink/60">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8" colSpan={4}>
                  No scores yet. Finish a quiz to open the board.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className="border-t border-ruled">
                  <td className="px-4 py-3 font-display text-xl">{i + 1}</td>
                  <td className="font-semibold">{row.nickname}</td>
                  <td>{row.subjectId}</td>
                  <td>
                    {row.percent}% · {row.scoredMarks}/{row.totalMarks}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
