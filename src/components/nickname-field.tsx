"use client";

import { useEffect, useState } from "react";
import { getStudentSettings, saveStudentSettings } from "@/lib/student-settings";

export function useNickname() {
  const [nickname, setNickname] = useState("Student");

  useEffect(() => {
    setNickname(getStudentSettings().nickname);
    const handler = () => {
      setNickname(getStudentSettings().nickname);
    };
    window.addEventListener("boardready-settings-change", handler);
    return () => window.removeEventListener("boardready-settings-change", handler);
  }, []);

  function save(value: string) {
    const updated = saveStudentSettings({ nickname: value });
    setNickname(updated.nickname);
  }

  return { nickname, save };
}

export function NicknameField() {
  const { nickname, save } = useNickname();
  return (
    <label className="block max-w-sm">
      <span className="mb-1 block text-sm font-semibold">Your quiz name</span>
      <input
        value={nickname}
        onChange={(e) => save(e.target.value)}
        maxLength={24}
        className="w-full rounded-xl border border-ruled bg-white px-3 py-2"
        aria-label="Nickname for the leaderboard"
      />
    </label>
  );
}
