"use client";

import { useMemo, useState } from "react";
import styles from "./Big3SetBuilder.module.css";
import { COEF_NOTES, EXERCISE_ORDER, EXERCISES, ExerciseKey, RM_COEFFICIENTS } from "@/lib/exercises";
import { computeGoalTable, computeWarmup, fmtWeight, roundWeight } from "@/lib/calc";

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

  const rm = parseFloat(rmInput);
  const exercise = EXERCISES[exerciseKey];

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
          {dayResults.map(({ day, mainWeight, warmup, backoff }) => (
            <div
              key={day.key}
              className={styles.dayCard}
              style={{ ["--stripe" as string]: DAY_STRIPE[day.key] }}
            >
              <h2>{day.label}</h2>
              <p className={styles.desc}>{day.desc}</p>

              <div className={styles.sectionLabel}>アップ</div>
              {warmup.length ? (
                <table className={styles.warmupTable}>
                  <tbody>
                    {warmup.map((w, i) => (
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

              <div className={styles.sectionLabel}>メイン</div>
              <div className={styles.setLine}>
                <div>
                  <span className={styles.wt}>{fmtWeight(mainWeight)} kg</span>{" "}
                  <span className={styles.meta}>
                    × {day.main.repsLow}〜{day.main.repsHigh}回 × {day.main.setsLabel}
                  </span>
                </div>
                <div className={styles.pct}>
                  {day.main.pctLow}〜{day.main.pctHigh}%
                </div>
              </div>

              {backoff && (
                <>
                  <div className={styles.sectionLabel}>バックオフ</div>
                  <div className={styles.setLine}>
                    <div>
                      <span className={styles.wt}>{fmtWeight(backoff.weight)} kg</span>{" "}
                      <span className={styles.meta}>
                        × {backoff.def.repsLow}〜{backoff.def.repsHigh}回 × {backoff.def.setsLabel}
                      </span>
                    </div>
                    <div className={styles.pct}>
                      {backoff.def.pctLow}〜{backoff.def.pctHigh}%
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className={styles.sectionHeading}>目標1RMから逆算</h2>
      <p className={styles.sectionLead}>
        目指す1RM（{exercise.name}）を入力すると、その重量が何kg×何回で「計算上の1RM」に到達するかを一覧表示します。RM換算式は
        1RM ≈ 重量×(1+回数/{RM_COEFFICIENTS[exerciseKey]}) を使用（{exercise.name}の係数）。
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
