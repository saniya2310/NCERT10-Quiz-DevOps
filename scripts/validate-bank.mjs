#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bankDir = join(root, "src", "data", "questions");
const files = readdirSync(bankDir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error("No question banks found.");
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const questions = JSON.parse(readFileSync(join(bankDir, file), "utf8"));
  if (!Array.isArray(questions) || questions.length < 8) {
    console.error(`${file}: need at least 8 questions`);
    process.exit(1);
  }
  const ids = new Set();
  for (const q of questions) {
    total += 1;
    if (!q.id || ids.has(q.id)) {
      console.error(`${file}: duplicate or missing id ${q.id}`);
      process.exit(1);
    }
    ids.add(q.id);
    if (!q.prompt || !q.explanation || !q.correctOptionId) {
      console.error(`${file}: incomplete question ${q.id}`);
      process.exit(1);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      console.error(`${file}: ${q.id} must have 4 options`);
      process.exit(1);
    }
    if (!q.options.some((o) => o.id === q.correctOptionId)) {
      console.error(`${file}: ${q.id} correct option missing`);
      process.exit(1);
    }
  }
}

console.log(`Question bank OK: ${files.length} files, ${total} questions`);
