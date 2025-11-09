// server/src/utils/progress.ts
export type ProgressResult = {
  level: number;
  exp: number;
  accuracy: number;
};

/**
 * percent -> 0..100
 * Rule:
 *  - EXP += rounded percent
 *  - Each 100 EXP -> +1 level; rollover remainder
 *  - Accuracy = last percent (rounded & clamped 0..100)
 */
export function applyPercentToProgress(
  currentLevel: number | undefined,
  currentExp: number | undefined,
  percent: number
): ProgressResult {
  const baseLevel = Number.isFinite(currentLevel) ? Number(currentLevel) : 1;
  const baseExp = Number.isFinite(currentExp) ? Number(currentExp) : 0;

  const deltaExp = Math.max(0, Math.round(percent));
  let exp = baseExp + deltaExp;
  let level = baseLevel;

  while (exp >= 100) {
    level += 1;
    exp -= 100;
  }

  const accuracy = Math.max(0, Math.min(100, Math.round(percent)));

  return { level, exp, accuracy };
}
