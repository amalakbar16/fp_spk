import type {
  AhpAverageResult,
  AhpConsistencyRow,
  AhpResult,
  Criterion,
} from "./types.ts";

export const SAATY_RI_TABLE: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

export interface SaatyOption {
  value: number;
  label: string;
}

export const SAATY_SCALE_OPTIONS: SaatyOption[] = [
  { value: 9, label: "9 - Mutlak lebih penting" },
  { value: 8, label: "8 - Antara 7 dan 9" },
  { value: 7, label: "7 - Sangat lebih penting" },
  { value: 6, label: "6 - Antara 5 dan 7" },
  { value: 5, label: "5 - Lebih penting" },
  { value: 4, label: "4 - Antara 3 dan 5" },
  { value: 3, label: "3 - Sedikit lebih penting" },
  { value: 2, label: "2 - Antara 1 dan 3" },
  { value: 1, label: "1 - Sama penting" },
  { value: 1 / 2, label: "1/2 - Antara 1 dan 1/3" },
  { value: 1 / 3, label: "1/3 - Sedikit kurang penting" },
  { value: 1 / 4, label: "1/4 - Antara 1/3 dan 1/5" },
  { value: 1 / 5, label: "1/5 - Kurang penting" },
  { value: 1 / 6, label: "1/6 - Antara 1/5 dan 1/7" },
  { value: 1 / 7, label: "1/7 - Sangat kurang penting" },
  { value: 1 / 8, label: "1/8 - Antara 1/7 dan 1/9" },
  { value: 1 / 9, label: "1/9 - Mutlak kurang penting" },
];

/**
 * Menghitung bobot prioritas dan uji konsistensi AHP (CR <= 0.10).
 * Rumus disesuaikan persis dengan sheet PERHITUNGAN AHP pada Excel Kelompok 12.
 */
export function computeAhp(
  criteria: Criterion[],
  pairwiseMatrix: number[][]
): AhpResult {
  const n = criteria.length;
  if (n === 0) {
    throw new Error("Daftar kriteria tidak boleh kosong.");
  }
  if (
    pairwiseMatrix.length !== n ||
    pairwiseMatrix.some((row) => row.length !== n)
  ) {
    throw new Error(`Matriks pairwise harus berukuran ${n}x${n}.`);
  }

  // Pastikan setiap entri bernilai positif dan diagonal bernilai 1
  const matrix = pairwiseMatrix.map((row, i) =>
    row.map((val, j) => {
      if (i === j) return 1;
      if (!Number.isFinite(val) || val <= 0) {
        throw new Error(
          `Nilai perbandingan pada baris ${i + 1} kolom ${j + 1} harus > 0.`
        );
      }
      return val;
    })
  );

  // 1. Jumlah setiap kolom matriks perbandingan berpasangan
  const columnSums: number[] = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += matrix[i][j];
    }
    columnSums[j] = sum;
  }

  // 2. Normalisasi matriks & hitung bobot prioritas (rata-rata baris)
  const normalizedMatrix: number[][] = matrix.map((row) =>
    row.map((val, j) => val / columnSums[j])
  );

  const weights: number[] = normalizedMatrix.map(
    (row) => row.reduce((acc, v) => acc + v, 0) / n
  );

  // 3. Hitung Weighted Sum Vector & Consistency Vector
  const weightedProductMatrix: number[][] = matrix.map((row) =>
    row.map((val, j) => val * weights[j])
  );

  const consistencyRows: AhpConsistencyRow[] = criteria.map((criterion, i) => {
    const weightedSum = weightedProductMatrix[i].reduce((acc, v) => acc + v, 0);
    const weight = weights[i];
    const consistencyVector = weight > 0 ? weightedSum / weight : 0;
    return {
      criterionId: criterion.id,
      code: criterion.code,
      name: criterion.name,
      weight,
      weightedSum,
      consistencyVector,
    };
  });

  // 4. Lambda max, CI, RI, dan CR
  const lambdaMax =
    consistencyRows.reduce((acc, row) => acc + row.consistencyVector, 0) / n;
  const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = SAATY_RI_TABLE[n] ?? 1.49;
  const cr = ri > 0 ? ci / ri : 0;

  return {
    n,
    criteria,
    pairwiseMatrix: matrix,
    columnSums,
    normalizedMatrix,
    weights,
    weightedProductMatrix,
    consistencyRows,
    lambdaMax,
    ci,
    ri,
    cr,
    isConsistent: cr <= 0.1,
    riTable: SAATY_RI_TABLE,
  };
}

/**
 * Mencocokkan nilai desimal/pecahan ke opsi skala Saaty terdekat (berbasis rasio log).
 */
export function closestSaatyValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  let best = SAATY_SCALE_OPTIONS[0].value;
  let minDiff = Infinity;
  for (const opt of SAATY_SCALE_OPTIONS) {
    const diff = Math.abs(Math.log(opt.value) - Math.log(value));
    if (diff < minDiff) {
      minDiff = diff;
      best = opt.value;
    }
  }
  return best;
}

/**
 * Membangun matriks pairwise n x n lengkap dari peta pasangan segitiga atas ("C1:C2" -> nilai).
 */
export function buildMatrixFromUpperPairs(
  criteria: Criterion[],
  upperPairs: Record<string, number>
): number[][] {
  return criteria.map((rowCrit, i) =>
    criteria.map((colCrit, j) => {
      if (i === j) return 1;
      const direct = upperPairs[`${rowCrit.code}:${colCrit.code}`];
      if (direct !== undefined && Number.isFinite(direct) && direct > 0) {
        return direct;
      }
      const reverse = upperPairs[`${colCrit.code}:${rowCrit.code}`];
      if (reverse !== undefined && Number.isFinite(reverse) && reverse > 0) {
        return 1 / reverse;
      }
      return 1;
    })
  );
}

/**
 * Menghitung matriks agregasi kelompok menggunakan Geometric Mean (AIJ).
 */
export function computeGeometricMeanMatrix(matrices: number[][][]): number[][] {
  if (matrices.length === 0) {
    throw new Error("Daftar matriks tidak boleh kosong.");
  }
  const n = matrices[0].length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1;
      let logSum = 0;
      for (const m of matrices) {
        const val = m[i][j];
        if (!Number.isFinite(val) || val <= 0) {
          throw new Error("Semua nilai matriks harus lebih besar dari 0.");
        }
        logSum += Math.log(val);
      }
      return Math.exp(logSum / matrices.length);
    })
  );
}

/**
 * Menghitung rata-rata bobot prioritas AHP per kriteria (AIP / Tabel 2 paper acuan)
 * sekaligus menyediakan agregasi matriks Geometric Mean (AIJ).
 */
export function computeAhpAverageResult(
  criteria: Criterion[],
  individualAhpResults: AhpResult[]
): AhpAverageResult {
  if (individualAhpResults.length === 0) {
    const identityMatrix = criteria.map((_, i) =>
      criteria.map((__, j) => (i === j ? 1 : 1))
    );
    const fallback = computeAhp(criteria, identityMatrix);
    return {
      respondentCount: 0,
      consistentCount: 0,
      cr: 0,
      isConsistent: true,
      weights: fallback.weights,
      groupGeometricAhp: fallback,
    };
  }

  const count = individualAhpResults.length;
  const consistentCount = individualAhpResults.filter(
    (item) => item.isConsistent
  ).length;
  const cr =
    individualAhpResults.reduce((acc, item) => acc + item.cr, 0) / count;
  const isConsistent = cr <= 0.1;
  const rawSums = criteria.map((_, j) =>
    individualAhpResults.reduce((acc, item) => acc + (item.weights[j] ?? 0), 0)
  );
  const meanWeights = rawSums.map((sum) => sum / count);
  const weightSum = meanWeights.reduce((acc, w) => acc + w, 0);
  const weights =
    weightSum > 0
      ? meanWeights.map((w) => w / weightSum)
      : criteria.map(() => 1 / criteria.length);

  const geoMatrix = computeGeometricMeanMatrix(
    individualAhpResults.map((item) => item.pairwiseMatrix)
  );
  const groupGeometricAhp = computeAhp(criteria, geoMatrix);

  return {
    respondentCount: count,
    consistentCount,
    cr,
    isConsistent,
    weights,
    groupGeometricAhp,
  };
}
