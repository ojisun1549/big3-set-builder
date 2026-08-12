"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Big3SetBuilder.module.css";
import { COEF_NOTES, EXERCISE_ORDER, EXERCISES, ExerciseKey, RM_COEFFICIENTS } from "@/lib/exercises";
import { computeGoalTable, computeWarmup, fmtWeight, roundWeight } from "@/lib/calc";
import { applySetLog, emptyProgressState, loadProgress, saveProgress, ProgressState, SetLog } from "@/lib/progress";

const INCREMENT = 2.5;
type TrackKind = "top" | "backoff";

const DAY_STRIPE: Record<string, string> = {
  main: "var(--main-day)",
  medium: "var(--medium-day)",
  light: "var(--light-day)",
};

const ROUND_OPTIONS = [
  { value: 2.5, label: "2.5kg刻み" },
  { value: 1.25, label: "1.25kg刻み" },
  { value: 5, label: "5kg刻み" },
];

export default function Big3SetBuilder() {
  const [exerciseKey, setExerciseKey] = useState<ExerciseKey>("bench");
  const [rmInput, setRmInput] = useState("82.5");
  const [roundInc, setRoundInc] = useState(2.5);
  const [goalInput, setGoalInput] = useState("100");
  const [progress, setProgress] = useState<ProgressState>(emptyProgressState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadProgress();
    if (loaded) setProgress(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveProgress(progress);
  }, [progress, hydrated]);

  const rm = parseFloat(rmInput);
  const exercise = EXERCISES[exerciseKey];
  const exProgress = progress[exerciseKey];

  function updateReps(kind: TrackKind, index: number, value: string) {
    setProgress((prev) => {
      const ex = prev[exerciseKey];
      const field = kind === "top" ? "topReps" : "backoffReps";
      const next = [...ex[field]] as SetLog;
      next[index] = value === "" ? null : Math.max(0, Math.floor(Number(value) || 0));
      return { ...prev, [exerciseKey]: { ...ex, [field]: next } };
    });
  }

  function submitLog(kind: TrackKind, currentWeight: number, targetReps: number) {
    setProgress((prev) => {
      const ex = prev[exerciseKey];
      const repsField = kind === "top" ? "topReps" : "backoffReps";
      const weightField = kind === "top" ? "topWeight" : "backoffWeight";
      const result = applySetLog(currentWeight, ex[repsField], targetReps, INCREMENT);
      return {
        ...prev,
        [exerciseKey]: { ...ex, [weightField]: result.weight, [repsField]: result.reps },
      };
    });
  }

  function resetTracking(kind: TrackKind) {
    setProgress((prev) => {
      const ex = prev[exerciseKey];
      const repsField = kind === "top" ? "topReps" : "backoffReps";
      const weightField = kind === "top" ? "topWeight" : "backoffWeight";
      return {
        ...prev,
        [exerciseKey]: { ...ex, [weightField]: null, [repsField]: [null, null, null] },
      };
    });
  }

  const goal = parseFloat(goalInput);
  const goalTable = useMemo(() => {
    if (!goal || goal <= 0) return null;
    return computeGoalTable(goal, RM_COEFFICIENTS[exerciseKey], roundInc, 10);
  }, [goal, exerciseKey, roundInc]);

  const dayResults = useMemo(() => {
    if (!rm || rm <= 0) return null;

    return exercise.days.map((day) => {
      const mainPctMid = (day.main.pctLow + day.main.pctHigh) / 2;
      const mainWeight = roundWeight((rm * mainPctMid) / 100, roundInc);
      const warmup = computeWarmup(mainWeight, roundInc, day.key === "main");

      const backoff = day.backoff
        ? (() => {
            const boPctMid = (day.backoff!.pctLow + day.backoff!.pctHigh) / 2;
            const boWeight = roundWeight((rm * boPctMid) / 100, roundInc);
            return { weight: boWeight, def: day.backoff! };
          })()
        : null;

      return { day, mainWeight, warmup, backoff };
    });
  }, [exercise, rm, roundInc]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>BIG3 セットビルダー</h1>
      <p className={styles.lead}>
        種目と1RMを入力すると、メイン day（アップ・メイン・バックオフ）／中強度 day／軽め day のセットを自動計算します。
      </p>

      <div className={styles.controls}>
        <div className={styles.field}>
          <label>種目</label>
          <div className={styles.exerciseButtons}>
            {EXERCISE_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                className={key === exerciseKey ? styles.active : undefined}
                onClick={() => setExerciseKey(key)}
              >
                {EXERCISES[key].name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="rmInput">1RM (kg)</label>
          <input
            id="rmInput"
            className={styles.input}
            type="number"
            min={1}
            step={0.5}
            value={rmInput}
            onChange={(e) => setRmInput(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="roundSelect">重量の丸め</label>
          <select
            id="roundSelect"
            className={styles.select}
            value={roundInc}
            onChange={(e) => setRoundInc(parseFloat(e.target.value))}
          >
            {ROUND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.coefNote}>{COEF_NOTES[exerciseKey]}</div>

      {!dayResults ? (
        <div className={styles.empty}>1RMを入力してください</div>
      ) : (
        <div className={styles.days}>
          {dayResults.map(({ day, mainWeight, warmup, backoff }) => {
            const isMainDay = day.key === "main";
            const effectiveTop = isMainDay ? exProgress.topWeight ?? mainWeight : mainWeight;
            const topWarmup = isMainDay ? computeWarmup(effectiveTop, roundInc, true) : warmup;
            const effectiveBackoff = backoff ? exProgress.backoffWeight ?? backoff.weight : null;

            return (
              <div
                key={day.key}
                className={styles.dayCard}
                style={{ ["--stripe" as string]: DAY_STRIPE[day.key] }}
              >
                <h2>{day.label}</h2>
                <p className={styles.desc}>{day.desc}</p>

                <div className={styles.sectionLabel}>アップ</div>
                {topWarmup.length ? (
                  <table className={styles.warmupTable}>
                    <tbody>
                      {topWarmup.map((w, i) => (
                        <tr key={i}>
                          <td className={styles.w}>{fmtWeight(w.weight)} kg</td>
                          <td className={styles.r}>× {w.reps}回</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.meta}>アップ省略可（軽重量のため）</div>
                )}

                <div className={styles.sectionLabel}>{isMainDay ? "メイン（トップセット）" : "メイン"}</div>
                <div className={styles.setLine}>
                  <div>
                    <span className={styles.wt}>{fmtWeight(effectiveTop)} kg</span>{" "}
                    <span className={styles.meta}>
                      × {day.main.repsLow}〜{day.main.repsHigh}回 × {day.main.setsLabel}
                    </span>
                  </div>
                  <div className={styles.pct}>
                    {day.main.pctLow}〜{day.main.pctHigh}%
                  </div>
                </div>

                {isMainDay && (
                  <SetTracker
                    reps={exProgress.topReps}
                    onChangeRep={(i, v) => updateReps("top", i, v)}
                    onLog={() => submitLog("top", effectiveTop, day.main.repsHigh)}
                    onReset={exProgress.topWeight !== null ? () => resetTracking("top") : undefined}
                    targetReps={day.main.repsHigh}
                    baseReps={day.main.repsLow}
                  />
                )}

                {backoff && (
                  <>
                    <div className={styles.sectionLabel}>バックオフ</div>
                    <div className={styles.setLine}>
                      <div>
                        <span className={styles.wt}>{fmtWeight(effectiveBackoff!)} kg</span>{" "}
                        <span className={styles.meta}>
                          × {backoff.def.repsLow}〜{backoff.def.repsHigh}回 × {backoff.def.setsLabel}
                        </span>
                      </div>
                      <div className={styles.pct}>
                        {backoff.def.pctLow}〜{backoff.def.pctHigh}%
                      </div>
                    </div>

                    <SetTracker
                      reps={exProgress.backoffReps}
                      onChangeRep={(i, v) => updateReps("backoff", i, v)}
                      onLog={() => submitLog("backoff", effectiveBackoff!, backoff.def.repsHigh)}
                      onReset={exProgress.backoffWeight !== null ? () => resetTracking("backoff") : undefined}
                      targetReps={backoff.def.repsHigh}
                      baseReps={backoff.def.repsLow}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className={styles.sectionHeading}>目標1RMから逆算</h2>
      <p className={styles.sectionLead}>
        目指す1RM（{exercise.name}）を入力すると、その重量が何kg×何回で「計算上の1RM」に到達するかを一覧表示します。RM換算式は
        1RM ≈ 重量×(1+(回数-1)/{RM_COEFFICIENTS[exerciseKey]}) を使用（{exercise.name}の係数、1回＝目標1RMそのもの）。
      </p>

      <div className={styles.goalCard}>
        <div className={styles.field}>
          <label htmlFor="goalInput">目標1RM (kg)</label>
          <input
            id="goalInput"
            className={styles.input}
            type="number"
            min={1}
            step={0.5}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
          />
        </div>

        {!goalTable ? (
          <div className={styles.empty}>目標1RMを入力してください</div>
        ) : (
          <table className={styles.goalTable}>
            <thead>
              <tr>
                <th>回数</th>
                <th>必要な重量</th>
                <th>目標1RM比</th>
              </tr>
            </thead>
            <tbody>
              {goalTable.map((row) => (
                <tr key={row.reps}>
                  <td className={styles.reps}>{row.reps}回</td>
                  <td className={styles.weight}>{fmtWeight(row.weight)} kg</td>
                  <td className={styles.pct}>{row.pctOfGoal.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SetTracker({
  reps,
  onChangeRep,
  onLog,
  onReset,
  targetReps,
  baseReps,
}: {
  reps: SetLog;
  onChangeRep: (index: number, value: string) => void;
  onLog: () => void;
  onReset?: () => void;
  targetReps: number;
  baseReps: number;
}) {
  return (
    <div className={styles.tracker}>
      <div className={styles.trackerRow}>
        {reps.map((r, i) => (
          <input
            key={i}
            type="number"
            min={0}
            className={styles.repsInput}
            placeholder={`${i + 1}set目`}
            value={r ?? ""}
            onChange={(e) => onChangeRep(i, e.target.value)}
          />
        ))}
        <button type="button" className={styles.logButton} onClick={onLog}>
          記録
        </button>
      </div>
      <p className={styles.trackerHint}>
        3セットとも{targetReps}回できれば次回+{INCREMENT}kgして{baseReps}回3セットから再開します。
        {onReset && (
          <>
            {" "}
            <button type="button" className={styles.resetLink} onClick={onReset}>
              1RM%の計算値に戻す
            </button>
          </>
        )}
      </p>
    </div>
  );
}
