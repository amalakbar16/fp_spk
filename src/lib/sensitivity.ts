import { computeSaw } from "./saw.ts";
import type {
  Alternative,
  Criterion,
  SensitivityResult,
  SensitivityRow,
} from "./types.ts";

/**
 * Menguji analisis sensitivitas (Bagian E.3 Panduan UAS):
 * Mengubah bobot satu kriteria dan menormalkan bobot kriteria lain secara proporsional
 * sehingga total bobot tetap = 1.
 */
export function computeSensitivity(
  criteria: Criterion[],
  alternatives: Alternative[],
  baseWeights: number[],
  targetCriterionCode: string,
  newWeight: number
): SensitivityResult {
  const targetIdx = criteria.findIndex(
    (c) => c.code.toUpperCase() === targetCriterionCode.toUpperCase()
  );
  if (targetIdx === -1) {
    throw new Error(`Kriteria ${targetCriterionCode} tidak ditemukan.`);
  }
  if (!Number.isFinite(newWeight) || newWeight < 0 || newWeight > 1) {
    throw new Error("Bobot baru harus berada pada rentang 0 sampai 1.");
  }

  const n = criteria.length;
  const oldTargetWeight = baseWeights[targetIdx];
  const remainingNew = 1 - newWeight;
  const remainingOld = baseWeights.reduce(
    (acc, w, idx) => (idx === targetIdx ? acc : acc + w),
    0
  );

  const adjustedWeights = baseWeights.map((w, idx) => {
    if (idx === targetIdx) return newWeight;
    if (remainingOld > 1e-12) {
      return w * (remainingNew / remainingOld);
    }
    return n > 1 ? remainingNew / (n - 1) : 0;
  });

  const weightSum = adjustedWeights.reduce((acc, w) => acc + w, 0);

  const baseSaw = computeSaw(criteria, alternatives, baseWeights);
  const newSaw = computeSaw(criteria, alternatives, adjustedWeights);

  const newById = new Map(
    newSaw.rankings.map((row) => [row.alternativeId, row])
  );

  const rows: SensitivityRow[] = baseSaw.rankings.map((baseRow) => {
    const newRow = newById.get(baseRow.alternativeId)!;
    return {
      alternativeId: baseRow.alternativeId,
      code: baseRow.code,
      name: baseRow.name,
      baseRank: baseRow.rank,
      newRank: newRow.rank,
      rankDelta: baseRow.rank - newRow.rank,
      baseVi: baseRow.vi,
      newVi: newRow.vi,
      viDelta: newRow.vi - baseRow.vi,
    };
  });

  const changedRankCount = rows.filter((r) => r.rankDelta !== 0).length;
  const baseWinnerCode = baseSaw.rankings[0]?.code ?? "-";
  const newWinnerCode = newSaw.rankings[0]?.code ?? "-";

  return {
    targetCriterionCode: criteria[targetIdx].code,
    targetCriterionName: criteria[targetIdx].name,
    baseWeight: oldTargetWeight,
    newWeight,
    baseWeights,
    adjustedWeights,
    weightSum,
    changedRankCount,
    winnerChanged: baseWinnerCode !== newWinnerCode,
    baseWinnerCode,
    newWinnerCode,
    rows,
  };
}
