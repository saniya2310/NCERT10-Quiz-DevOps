import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AttemptResult, LeaderboardEntry } from "./types";

const dataPath = process.env.LEADERBOARD_PATH ?? join(process.cwd(), ".data", "leaderboard.json");

type Store = {
  attempts: AttemptResult[];
  leaderboard: LeaderboardEntry[];
};

function empty(): Store {
  return { attempts: [], leaderboard: [] };
}

function readStore(): Store {
  try {
    return JSON.parse(readFileSync(dataPath, "utf8")) as Store;
  } catch {
    return empty();
  }
}

function writeStore(store: Store) {
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

export function saveAttempt(result: AttemptResult) {
  const store = readStore();
  // If an attempt with this id already exists, update it; otherwise prepend
  const existingIndex = store.attempts.findIndex((a) => a.id === result.id);
  if (existingIndex >= 0) {
    store.attempts[existingIndex] = result;
  } else {
    store.attempts.unshift(result);
  }
  store.attempts = store.attempts.slice(0, 500);

  // Update leaderboard
  store.leaderboard = store.leaderboard.filter((l) => l.id !== result.id);
  store.leaderboard.push({
    id: result.id,
    nickname: result.nickname,
    subjectId: result.subjectId,
    percent: result.percent,
    scoredMarks: result.scoredMarks,
    totalMarks: result.totalMarks,
    createdAt: result.createdAt,
  });
  store.leaderboard.sort((a, b) => b.percent - a.percent || b.scoredMarks - a.scoredMarks);
  store.leaderboard = store.leaderboard.slice(0, 200);
  writeStore(store);
  return result;
}

export function getAttempt(id: string) {
  return readStore().attempts.find((a) => a.id === id);
}

export function deleteAttempt(id: string): boolean {
  const store = readStore();
  const initialAttemptsCount = store.attempts.length;
  store.attempts = store.attempts.filter((a) => a.id !== id);
  store.leaderboard = store.leaderboard.filter((l) => l.id !== id);
  if (store.attempts.length !== initialAttemptsCount) {
    writeStore(store);
    return true;
  }
  return false;
}

export function getLeaderboard(subjectId?: string) {
  const rows = readStore().leaderboard;
  const filtered = subjectId && subjectId !== "all" ? rows.filter((r) => r.subjectId === subjectId) : rows;
  return filtered.slice(0, 25);
}

export function getStoreStats() {
  const store = readStore();
  const totalAttempts = store.attempts.length;
  const avgScore = totalAttempts > 0 ? store.attempts.reduce((a, b) => a + b.percent, 0) / totalAttempts : 0;
  return {
    totalAttempts,
    leaderboardEntries: store.leaderboard.length,
    averageScorePercent: Math.round(avgScore * 10) / 10,
  };
}

