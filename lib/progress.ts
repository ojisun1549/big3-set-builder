import { ExerciseKey } from "./exercises";

export type SetLog = [number | null, number | null, number | null];

export type ExerciseProgress = {
  topWeight: number | null; // null = まだ記録なし。1RM%から計算した重量を使う
  backoffWeight: number | null;
  topReps: SetLog;
  backoffReps: SetLog;
};

export function emptyProgress(): ExerciseProgress {
  return { topWeight: null, backoffWeight: null, topReps: [null, null, null], backoffReps: [null, null, null] };
}

export type ProgressState = Record<ExerciseKey, ExerciseProgress>;

export function emptyProgressState(): ProgressState {
  return { bench: emptyProgress(), squat: emptyProgress(), deadlift: emptyProgress() };
}

const STORAGE_KEY = "big3-set-builder:progress:v1";

export function loadProgress(): ProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const base = emptyProgressState();
    return {
      bench: { ...base.bench, ...parsed.bench },
      squat: { ...base.squat, ...parsed.squat },
      deadlift: { ...base.deadlift, ...parsed.deadlift },
    };
  } catch {
    return null;
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ストレージが使えない環境では無視する
  }
}

const MAX_LOGGED_REPS = 20;

// +1/-1ボタンでの回数入力。未入力(null) -> 0 -> 1 -> 2 ... と行き来する
// （0から-1でnullに戻り、未入力状態にクリアできる）。
export function stepRep(current: number | null, delta: number): number | null {
  if (delta > 0) {
    const next = current === null ? 1 : current + delta;
    return Math.min(next, MAX_LOGGED_REPS);
  }
  if (current === null) return null;
  if (current === 0) return null;
  return Math.max(current + delta, 0);
}

// 3セットすべてが目標回数（レンジ上限）以上できていれば達成とみなす。
export function isAchieved(reps: SetLog, targetReps: number): boolean {
  return reps.every((r) => r !== null && r >= targetReps);
}

// 達成していれば重量を増量してログをリセットし、そうでなければ入力値をそのまま保存する。
export function applySetLog(
  currentWeight: number,
  reps: SetLog,
  targetReps: number,
  increment: number
): { weight: number; reps: SetLog; advanced: boolean } {
  if (isAchieved(reps, targetReps)) {
    return { weight: currentWeight + increment, reps: [null, null, null], advanced: true };
  }
  return { weight: currentWeight, reps, advanced: false };
}
