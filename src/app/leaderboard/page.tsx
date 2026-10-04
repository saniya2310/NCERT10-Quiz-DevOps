"use client";

import { useEffect, useState } from "react";
import { getSavedResults } from "@/lib/saved-results";
import { SUBJECTS } from "@/lib/bank";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const url =
          selectedSubject === "all"
            ? "/api/leaderboard"
            : `/api/leaderboard?subject=${selectedSubject}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setEntries(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback to local storage
      const local = getSavedResults();
      let filtered = local;
      if (selectedSubject !== "all") {
        filtered = local.filter((r) => r.subjectId === selectedSubject);
      }
      const mapped: LeaderboardEntry[] = filtered.map((r) => ({
        id: r.id,
        nickname: r.nickname,
        subjectId: r.subjectId,
        percent: r.percent,
        scoredMarks: r.scoredMarks,
        totalMarks: r.totalMarks,
        createdAt: r.createdAt,
      }));
      setEntries(mapped.sort((a, b) => b.percent - a.percent || b.scoredMarks - a.scoredMarks));
      setLoading(false);
    }
    load();
  }, [selectedSubject]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-5xl">Leaderboard</h1>
      <p className="max-w-xl text-ink/70">
        Ranked by percentage, then marks scored. Complete quizzes to climb the board!
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedSubject("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            selectedSubject === "all" ? "bg-ink text-paper" : "bg-white shadow hover:bg-paper"
          }`}
        >
          All
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedSubject(s.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              selectedSubject === s.id ? "bg-ink text-paper" : "bg-white shadow hover:bg-paper"
            }`}
          >
            {s.short}
          </button>
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
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-ink/60" colSpan={4}>
                  Loading scores…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td className="px-4 py-8" colSpan={4}>
                  No quiz scores saved yet. Take a quiz to open the board!
                </td>
              </tr>
            ) : (
              entries.map((row, i) => (
                <tr key={row.id} className="border-t border-ruled">
                  <td className="px-4 py-3 font-display text-xl">{i + 1}</td>
                  <td className="font-semibold">{row.nickname}</td>
                  <td className="capitalize">{row.subjectId}</td>
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
