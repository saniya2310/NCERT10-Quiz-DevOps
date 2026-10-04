import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ATTEMPTS_TABLE, getDocClient, isDynamoDBConfigured, LEADERBOARD_TABLE } from "./dynamodb";
import type { AttemptResult, LeaderboardEntry } from "./types";

const dataPath = process.env.LEADERBOARD_PATH ?? join(process.cwd(), ".data", "leaderboard.json");

type Store = {
  attempts: AttemptResult[];
  leaderboard: LeaderboardEntry[];
};

function empty(): Store {
  return { attempts: [], leaderboard: [] };
}

function readLocalStore(): Store {
  try {
    return JSON.parse(readFileSync(dataPath, "utf8")) as Store;
  } catch {
    return empty();
  }
}

function writeLocalStore(store: Store) {
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

export async function saveAttempt(result: AttemptResult): Promise<AttemptResult> {
  if (isDynamoDBConfigured()) {
    try {
      const doc = getDocClient();
      await doc.send(
        new PutCommand({
          TableName: ATTEMPTS_TABLE,
          Item: result,
        })
      );

      const leaderboardItem = {
        id: result.id,
        nickname: result.nickname,
        subjectId: result.subjectId,
        globalKey: "ALL",
        percent: result.percent,
        scoredMarks: result.scoredMarks,
        totalMarks: result.totalMarks,
        createdAt: result.createdAt,
      };

      await doc.send(
        new PutCommand({
          TableName: LEADERBOARD_TABLE,
          Item: leaderboardItem,
        })
      );

      return result;
    } catch (err) {
      console.warn("DynamoDB saveAttempt error, falling back to local file:", err);
    }
  }

  // Fallback to local store
  const store = readLocalStore();
  const existingIndex = store.attempts.findIndex((a) => a.id === result.id);
  if (existingIndex >= 0) {
    store.attempts[existingIndex] = result;
  } else {
    store.attempts.unshift(result);
  }
  store.attempts = store.attempts.slice(0, 500);

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
  writeLocalStore(store);
  return result;
}

export async function getAttempt(id: string): Promise<AttemptResult | undefined> {
  if (isDynamoDBConfigured()) {
    try {
      const doc = getDocClient();
      const res = await doc.send(
        new GetCommand({
          TableName: ATTEMPTS_TABLE,
          Key: { id },
        })
      );
      if (res.Item) {
        return res.Item as AttemptResult;
      }
    } catch (err) {
      console.warn("DynamoDB getAttempt error, falling back to local store:", err);
    }
  }

  return readLocalStore().attempts.find((a) => a.id === id);
}

export async function deleteAttempt(id: string): Promise<boolean> {
  if (isDynamoDBConfigured()) {
    try {
      const doc = getDocClient();
      await Promise.all([
        doc.send(new DeleteCommand({ TableName: ATTEMPTS_TABLE, Key: { id } })),
        doc.send(new DeleteCommand({ TableName: LEADERBOARD_TABLE, Key: { id } })),
      ]);
      return true;
    } catch (err) {
      console.warn("DynamoDB deleteAttempt error, falling back to local store:", err);
    }
  }

  const store = readLocalStore();
  const initialAttemptsCount = store.attempts.length;
  store.attempts = store.attempts.filter((a) => a.id !== id);
  store.leaderboard = store.leaderboard.filter((l) => l.id !== id);
  if (store.attempts.length !== initialAttemptsCount) {
    writeLocalStore(store);
    return true;
  }
  return false;
}

export async function getLeaderboard(subjectId?: string): Promise<LeaderboardEntry[]> {
  if (isDynamoDBConfigured()) {
    try {
      const doc = getDocClient();
      const isFiltered = subjectId && subjectId !== "all";

      const queryOutput = await doc.send(
        new QueryCommand({
          TableName: LEADERBOARD_TABLE,
          IndexName: isFiltered ? "SubjectLeaderboardIndex" : "GlobalLeaderboardIndex",
          KeyConditionExpression: isFiltered ? "subjectId = :s" : "globalKey = :g",
          ExpressionAttributeValues: isFiltered
            ? { ":s": subjectId }
            : { ":g": "ALL" },
          ScanIndexForward: false,
          Limit: 25,
        })
      );

      if (queryOutput.Items && queryOutput.Items.length > 0) {
        const items = queryOutput.Items as (LeaderboardEntry & { globalKey?: string })[];
        items.sort((a, b) => b.percent - a.percent || b.scoredMarks - a.scoredMarks);
        return items.map(({ id, nickname, subjectId, percent, scoredMarks, totalMarks, createdAt }) => ({
          id,
          nickname,
          subjectId,
          percent,
          scoredMarks,
          totalMarks,
          createdAt,
        }));
      }
      return [];
    } catch (err) {
      console.warn("DynamoDB getLeaderboard error, falling back to local store:", err);
    }
  }

  const rows = readLocalStore().leaderboard;
  const filtered = subjectId && subjectId !== "all" ? rows.filter((r) => r.subjectId === subjectId) : rows;
  return filtered.slice(0, 25);
}

export async function getStoreStats(): Promise<{
  totalAttempts: number;
  leaderboardEntries: number;
  averageScorePercent: number;
}> {
  if (isDynamoDBConfigured()) {
    try {
      const doc = getDocClient();
      const [attemptsRes, lbRes] = await Promise.all([
        doc.send(new ScanCommand({ TableName: ATTEMPTS_TABLE, Select: "COUNT" })),
        doc.send(new ScanCommand({ TableName: LEADERBOARD_TABLE, Select: "COUNT" })),
      ]);
      const totalAttempts = attemptsRes.Count ?? 0;
      const leaderboardEntries = lbRes.Count ?? 0;
      return {
        totalAttempts,
        leaderboardEntries,
        averageScorePercent: 0,
      };
    } catch (err) {
      console.warn("DynamoDB getStoreStats error, falling back to local store:", err);
    }
  }

  const store = readLocalStore();
  const totalAttempts = store.attempts.length;
  const avgScore = totalAttempts > 0 ? store.attempts.reduce((a, b) => a + b.percent, 0) / totalAttempts : 0;
  return {
    totalAttempts,
    leaderboardEntries: store.leaderboard.length,
    averageScorePercent: Math.round(avgScore * 10) / 10,
  };
}
