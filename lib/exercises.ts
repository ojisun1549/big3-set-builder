export type ExerciseKey = "bench" | "squat" | "deadlift";
export type DayKey = "main" | "medium" | "light";

export type PctRange = {
  pctLow: number;
  pctHigh: number;
  repsLow: number;
  repsHigh: number;
  setsLabel: string;
};

export type DayDef = {
  key: DayKey;
  label: string;
  desc: string;
  main: PctRange;
  backoff?: PctRange;
};

export type ExerciseDef = {
  name: string;
  days: DayDef[];
};

// ベンチプレスを基準の%1RMレンジとする。
// スクワット/デッドリフトは RM換算式の係数差
// (ベンチ: 1RM = W×(1+reps/40) に対し スクワット・デッドリフト: 1RM = W×(1+reps/33.3))
// を根拠に、同じ目標reps帯であれば必要な%1RMが約2〜3pt低くなるため、
// 各レンジを一律 -2.5pt シフトして反映している。
export const EXERCISES: Record<ExerciseKey, ExerciseDef> = {
  bench: {
    name: "ベンチプレス",
    days: [
      {
        key: "main",
        label: "胸の日（メイン）",
        desc: "筋力+筋肥大の主日",
        main: { pctLow: 82.5, pctHigh: 87.5, repsLow: 3, repsHigh: 4, setsLabel: "3セット" },
        backoff: { pctLow: 72.5, pctHigh: 77.5, repsLow: 6, repsHigh: 8, setsLabel: "3セット" },
      },
      {
        key: "medium",
        label: "背中の日（中強度）",
        desc: "中強度・技術＋筋力",
        main: { pctLow: 75, pctHigh: 82.5, repsLow: 4, repsHigh: 6, setsLabel: "3セット" },
      },
      {
        key: "light",
        label: "足の日（軽め）",
        desc: "軽め・フォーム練習",
        main: { pctLow: 65, pctHigh: 72.5, repsLow: 5, repsHigh: 8, setsLabel: "2〜3セット" },
      },
    ],
  },
  squat: {
    name: "スクワット",
    days: [
      {
        key: "main",
        label: "メインDay（高強度）",
        desc: "筋力+筋肥大の主日",
        main: { pctLow: 80, pctHigh: 85, repsLow: 3, repsHigh: 4, setsLabel: "3セット" },
        backoff: { pctLow: 70, pctHigh: 75, repsLow: 6, repsHigh: 8, setsLabel: "3セット" },
      },
      {
        key: "medium",
        label: "中強度Day",
        desc: "中強度・技術＋筋力",
        main: { pctLow: 72.5, pctHigh: 80, repsLow: 4, repsHigh: 6, setsLabel: "3セット" },
      },
      {
        key: "light",
        label: "軽めDay",
        desc: "軽め・フォーム練習",
        main: { pctLow: 62.5, pctHigh: 70, repsLow: 5, repsHigh: 8, setsLabel: "2〜3セット" },
      },
    ],
  },
  deadlift: {
    name: "デッドリフト",
    days: [
      {
        key: "main",
        label: "メインDay（高強度）",
        desc: "筋力+筋肥大の主日",
        main: { pctLow: 80, pctHigh: 85, repsLow: 3, repsHigh: 4, setsLabel: "3セット" },
        backoff: { pctLow: 70, pctHigh: 75, repsLow: 6, repsHigh: 8, setsLabel: "3セット" },
      },
      {
        key: "medium",
        label: "中強度Day",
        desc: "中強度・技術＋筋力",
        main: { pctLow: 72.5, pctHigh: 80, repsLow: 4, repsHigh: 6, setsLabel: "3セット" },
      },
      {
        key: "light",
        label: "軽めDay",
        desc: "軽め・フォーム練習",
        main: { pctLow: 62.5, pctHigh: 70, repsLow: 5, repsHigh: 8, setsLabel: "2〜3セット" },
      },
    ],
  },
};

export const COEF_NOTES: Record<ExerciseKey, string> = {
  bench:
    "ベンチプレスのRM換算式は 1RM ≈ 重量×(1+回数/40) が目安とされます。上表の%レンジはこの係数を基準にしています。",
  squat:
    "スクワットはベンチプレスに比べ大筋群を使い疲労耐性が高いため、RM換算式の係数は 1RM ≈ 重量×(1+回数/33.3) が目安とされます（ベンチの40より小さい）。これは同じ目標レップ数でもベンチより低めの%1RMで届くことを意味するため、各%レンジをベンチ比で約2.5pt下げて算出しています。",
  deadlift:
    "デッドリフトもスクワットと同様、RM換算式の係数は 1RM ≈ 重量×(1+回数/33.3) が目安とされます（ベンチの40より小さい）。同じ目標レップ数でもベンチより低めの%1RMで届くため、各%レンジをベンチ比で約2.5pt下げて算出しています。",
};

export const EXERCISE_ORDER: ExerciseKey[] = ["bench", "squat", "deadlift"];

// RM換算式の係数 (1RM ≈ 重量×(1+reps/係数))。
// ベンチプレスは40、スクワット・デッドリフトは大筋群かつ疲労耐性が高いため33.3を使用。
export const RM_COEFFICIENTS: Record<ExerciseKey, number> = {
  bench: 40,
  squat: 33.3,
  deadlift: 33.3,
};
