import type { AttemptResult } from "./types";

const SAVED_RESULTS_KEY = "boardready-saved-results";
const EVENT_NAME = "boardready-saved-results-change";

export function getSavedResults(): AttemptResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedResult(id: string): AttemptResult | null {
  const all = getSavedResults();
  return all.find((r) => r.id === id) ?? null;
}

export function isResultSaved(id: string): boolean {
  const all = getSavedResults();
  return all.some((r) => r.id === id);
}

export function saveResult(result: AttemptResult): void {
  if (typeof window === "undefined") return;
  const current = getSavedResults();
  // Filter out any duplicate with the same id, then prepend
  const updated = [result, ...current.filter((r) => r.id !== result.id)];
  localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(updated.slice(0, 100)));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function deleteSavedResult(id: string): void {
  if (typeof window === "undefined") return;
  const current = getSavedResults();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearAllSavedResults(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAVED_RESULTS_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onSavedResultsChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}
