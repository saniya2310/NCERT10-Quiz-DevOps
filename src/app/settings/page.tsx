"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getStudentSettings,
  saveStudentSettings,
  type StudentSettings,
} from "@/lib/student-settings";
import {
  clearAllSavedResults,
  getSavedResults,
  onSavedResultsChange,
} from "@/lib/saved-results";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StudentSettings>(() => getStudentSettings());
  const [nicknameInput, setNicknameInput] = useState(settings.nickname);
  const [savedCount, setSavedCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const s = getStudentSettings();
    setSettings(s);
    setNicknameInput(s.nickname);
    setSavedCount(getSavedResults().length);

    return onSavedResultsChange(() => {
      setSavedCount(getSavedResults().length);
    });
  }, []);

  function handleSaveNickname(e: React.FormEvent) {
    e.preventDefault();
    const updated = saveStudentSettings({ nickname: nicknameInput });
    setSettings(updated);
    setSavedNotice("Quiz name updated successfully!");
    setTimeout(() => setSavedNotice(null), 3000);
  }

  function handleTimerChange(seconds: number) {
    const updated = saveStudentSettings({ timerDurationSec: seconds });
    setSettings(updated);
    setSavedNotice("Timer preference saved!");
    setTimeout(() => setSavedNotice(null), 2500);
  }

  function handleToggleAutoSave() {
    const updated = saveStudentSettings({ autoSaveResults: !settings.autoSaveResults });
    setSettings(updated);
    setSavedNotice(
      updated.autoSaveResults
        ? "Auto-saving quiz results enabled."
        : "Auto-saving disabled. You can still save results manually.",
    );
    setTimeout(() => setSavedNotice(null), 2500);
  }

  function handleToggleNcertRef() {
    const updated = saveStudentSettings({ showNcertReferences: !settings.showNcertReferences });
    setSettings(updated);
    setSavedNotice("NCERT reference preference saved!");
    setTimeout(() => setSavedNotice(null), 2500);
  }

  function handleClearHistory() {
    clearAllSavedResults();
    setSavedCount(0);
    setConfirmClear(false);
    setSavedNotice("All saved quiz results have been cleared.");
    setTimeout(() => setSavedNotice(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl">Student Settings</h1>
        <p className="mt-2 text-ink/75">
          Customize your Class 10 NCERT practice preferences and manage your revision data.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition">
          ✓ {savedNotice}
        </div>
      )}

      {/* Student Profile Section */}
      <section className="rounded-3xl bg-white p-6 shadow-sheet sm:p-8">
        <h2 className="font-display text-2xl">Student Profile</h2>
        <p className="mt-1 text-sm text-ink/65">
          Your quiz name appears on the leaderboard and on your score reports.
        </p>

        <form onSubmit={handleSaveNickname} className="mt-5 max-w-md space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink">Your Quiz Name / Nickname</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={24}
                placeholder="Student"
                className="w-full rounded-xl border border-ruled bg-paper/50 px-3.5 py-2.5 text-base text-ink focus:border-ink focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink/90"
              >
                Save
              </button>
            </div>
          </label>
        </form>

        <div className="mt-5 border-t border-ruled pt-4">
          <div className="flex items-center gap-3 text-sm text-ink/75">
            <span className="font-semibold">Curriculum Level:</span>
            <span className="rounded-full bg-highlight px-3 py-1 font-bold text-ink">
              Class 10 · NCERT / CBSE
            </span>
          </div>
        </div>
      </section>

      {/* Practice Preferences */}
      <section className="rounded-3xl bg-white p-6 shadow-sheet sm:p-8">
        <h2 className="font-display text-2xl">Quiz Practice Preferences</h2>
        <p className="mt-1 text-sm text-ink/65">
          Adjust the question pace and display preferences to suit your revision style.
        </p>

        <div className="mt-6 space-y-6">
          {/* Question Timer */}
          <div>
            <label className="block text-sm font-semibold text-ink">Question Timer</label>
            <p className="text-xs text-ink/60">
              Select how much time you want per question during practice.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-4">
              {[
                { sec: 45, label: "45 Seconds", sub: "Standard Board Pace" },
                { sec: 60, label: "60 Seconds", sub: "Relaxed / Thinking" },
                { sec: 30, label: "30 Seconds", sub: "Speed Sprint" },
                { sec: 0, label: "Untimed", sub: "Study / No Pressure" },
              ].map((opt) => {
                const active = settings.timerDurationSec === opt.sec;
                return (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => handleTimerChange(opt.sec)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-ink bg-highlight font-semibold shadow-sm"
                        : "border-ruled bg-paper/50 hover:border-ink/40"
                    }`}
                  >
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className="block text-xs text-ink/65">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-save Quiz Results */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ruled pt-4">
            <div>
              <p className="text-sm font-semibold text-ink">Auto-save Quiz Results</p>
              <p className="text-xs text-ink/60">
                Automatically keep your final score and detailed explanations in Saved Results.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoSave}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                settings.autoSaveResults ? "bg-emerald-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  settings.autoSaveResults ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* NCERT References */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ruled pt-4">
            <div>
              <p className="text-sm font-semibold text-ink">Show NCERT Textbook References</p>
              <p className="text-xs text-ink/60">
                Displays the specific NCERT textbook and chapter tag on each question card.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleNcertRef}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                settings.showNcertReferences ? "bg-emerald-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  settings.showNcertReferences ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Saved Results Management */}
      <section className="rounded-3xl bg-white p-6 shadow-sheet sm:p-8">
        <h2 className="font-display text-2xl">Saved Quiz Results &amp; Data</h2>
        <p className="mt-1 text-sm text-ink/65">
          Manage your saved scores and question explanations stored on this device.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-paper/60 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              {savedCount} {savedCount === 1 ? "Quiz Result" : "Quiz Results"} Saved
            </p>
            <p className="text-xs text-ink/60">
              Access your previous answers and revision explanations anytime.
            </p>
          </div>
          <Link
            href="/results"
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-ink/90"
          >
            Open Saved Results →
          </Link>
        </div>

        {savedCount > 0 && (
          <div className="mt-6 border-t border-ruled pt-4">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                Clear All Saved Quiz History
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3">
                <span className="text-xs font-semibold text-rose-800">
                  Are you sure you want to delete all saved quiz results?
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Yes, Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-rose-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
