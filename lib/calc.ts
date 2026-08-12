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
