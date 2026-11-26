import type {
  Alternative,
  Criterion,
  SawCriterionStat,
  SawMatrixRow,
  SawResult,
} from "./types.ts";

export function getAlternativeValueByCode(
  alt: Alternative,
  criterionCode: string
): number {
  switch (criterionCode.toUpperCase()) {
    case "C1":
      return alt.price;
    case "C2":
      return alt.processorScore;
    case "C3":
      return alt.ramGb;
    case "C4":
      return alt.storageGb;
    case "C5":
      return alt.batteryMah;
    case "C6":
      return alt.cameraScore;
    default:
      throw new Error(`Kode kriteria tidak dikenal: ${criterionCode}`);
  }
}

/**
 * Menghitung metode Simple Additive Weighting (SAW) secara bertahap:
 * 1. Matriks Keputusan (X)
 * 2. Matriks Ternormalisasi (R) — Cost: min / x_ij, Benefit: x_ij / max
 * 3. Matriks Terbobot (W * R) dan Nilai Preferensi (Vi)
 * 4. Pemeringkatan Akhir
 */
export function computeSaw(
  criteria: Criterion[],
  alternatives: Alternative[],
  weights: number[]
): SawResult {
  if (criteria.length !== weights.length) {
    throw new Error("Jumlah bobot harus sama dengan jumlah kriteria.");
  }

  const rawMatrix = alternatives.map((alt) =>
    criteria.map((c) => getAlternativeValueByCode(alt, c.code))
  );

  const criteriaStats: SawCriterionStat[] = criteria.map((c, j) => {
    const colValues = rawMatrix.map((row) => row[j]);
    const minValue = colValues.length > 0 ? Math.min(...colValues) : 0;
    const maxValue = colValues.length > 0 ? Math.max(...colValues) : 0;
    return {
      criterionId: c.id,
      code: c.code,
      name: c.name,
      attributeType: c.attributeType,
      unit: c.unit,
      weight: weights[j],
      minValue,
      maxValue,
    };
  });

  const rowsWithoutRank = alternatives.map((alt, i) => {
    const rawValues = rawMatrix[i];
    const normalizedValues = rawValues.map((val, j) => {
      const stat = criteriaStats[j];
      if (stat.attributeType === "cost") {
        return val > 0 ? stat.minValue / val : 0;
      }
      return stat.maxValue > 0 ? val / stat.maxValue : 0;
    });
    const weightedValues = normalizedValues.map(
      (r, j) => r * criteriaStats[j].weight
    );
    const vi = weightedValues.reduce((acc, v) => acc + v, 0);

    return {
      alternativeId: alt.id,
      code: alt.code,
      name: alt.name,
      rawValues,
      normalizedValues,
      weightedValues,
      vi,
      rank: 0,
    };
  });

  const sorted = [...rowsWithoutRank].sort((a, b) => {
    if (Math.abs(b.vi - a.vi) > 1e-12) return b.vi - a.vi;
    return a.code.localeCompare(b.code, undefined, { numeric: true });
  });

  const rankByAltId = new Map<number, number>();
  sorted.forEach((row, index) => {
    rankByAltId.set(row.alternativeId, index + 1);
  });

  const rows: SawMatrixRow[] = rowsWithoutRank.map((row) => ({
    ...row,
    rank: rankByAltId.get(row.alternativeId) ?? 0,
  }));

  const rankings: SawMatrixRow[] = sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));

  return {
    criteriaStats,
    rows,
    rankings,
  };
}
