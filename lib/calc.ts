export type WarmupStep = {
  weight: number;
  reps: string;
};

export function roundWeight(w: number, inc: number): number {
  return Math.round(w / inc) * inc;
}

export function fmtWeight(w: number): string {
  return (Math.round(w * 100) / 100).toString().replace(/\.0$/, "");
}

export type GoalRow = {
  reps: number;
  weight: number;
  pctOfGoal: number;
};

// 目標1RMを reps回で達成するために必要な重量を逆算する。
// 1RM ≈ 重量×(1+(reps-1)/係数) を 重量について解くと 重量 = 1RM/(1+(reps-1)/係数)。
// reps-1 を使うのは、reps=1（1回=1RMそのもの）のとき水増しなしで
// 必要重量＝目標1RMとなるようにするため（reps をそのまま使うと、1回上げただけの
// 重量が定義上の1RMより低い値として逆算されてしまう）。
export function computeGoalTable(
  goalRM: number,
  coefficient: number,
  inc: number,
  maxReps: number = 10
): GoalRow[] {
  const rows: GoalRow[] = [];
  for (let reps = 1; reps <= maxReps; reps++) {
    const rawWeight = goalRM / (1 + (reps - 1) / coefficient);
    const weight = roundWeight(rawWeight, inc);
    rows.push({ reps, weight, pctOfGoal: (weight / goalRM) * 100 });
  }
  return rows;
}

export function computeWarmup(topWeight: number, inc: number, includeTopStep: boolean): WarmupStep[] {
  const steps: { pct: number; reps: string }[] = [
    { pct: 0.4, reps: "8〜10" },
    { pct: 0.6, reps: "4〜5" },
    { pct: 0.75, reps: "2〜3" },
  ];
  if (includeTopStep) steps.push({ pct: 0.87, reps: "1〜2" });

  const rows: WarmupStep[] = [];
  let last = 0;
  for (const s of steps) {
    const w = roundWeight(topWeight * s.pct, inc);
    if (w < inc) continue;
    if (w <= last) continue; // 丸めで重複/逆転する場合はスキップ
    rows.push({ weight: w, reps: s.reps });
    last = w;
  }
  return rows;
}
