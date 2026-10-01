export type StudentSettings = {
  nickname: string;
  timerDurationSec: number; // 45 standard, 60 relaxed, 30 speed, 0 untimed
  autoSaveResults: boolean;
  showNcertReferences: boolean;
};

const SETTINGS_KEY = "boardready-student-settings";
const NICKNAME_KEY = "boardready-nickname";

export const DEFAULT_SETTINGS: StudentSettings = {
  nickname: "Student",
  timerDurationSec: 45,
  autoSaveResults: true,
  showNcertReferences: true,
};

export function getStudentSettings(): StudentSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const nickname = localStorage.getItem(NICKNAME_KEY) || DEFAULT_SETTINGS.nickname;
    if (!raw) {
      return { ...DEFAULT_SETTINGS, nickname };
    }
    const parsed = JSON.parse(raw);
    return {
      nickname: parsed.nickname || nickname,
      timerDurationSec: typeof parsed.timerDurationSec === "number" ? parsed.timerDurationSec : DEFAULT_SETTINGS.timerDurationSec,
      autoSaveResults: typeof parsed.autoSaveResults === "boolean" ? parsed.autoSaveResults : DEFAULT_SETTINGS.autoSaveResults,
      showNcertReferences: typeof parsed.showNcertReferences === "boolean" ? parsed.showNcertReferences : DEFAULT_SETTINGS.showNcertReferences,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStudentSettings(settings: Partial<StudentSettings>): StudentSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = getStudentSettings();
  const next: StudentSettings = {
    ...current,
    ...settings,
    nickname: settings.nickname !== undefined ? settings.nickname.trim().slice(0, 24) || "Student" : current.nickname,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  localStorage.setItem(NICKNAME_KEY, next.nickname);
  window.dispatchEvent(new Event("boardready-settings-change"));
  return next;
}
