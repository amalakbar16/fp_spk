import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatrixFromUpperPairs,
  computeAhp,
  computeAhpAverageResult,
} from "../src/lib/ahp.ts";
import { calculateCameraScore } from "../src/lib/camera-score.ts";
import { computeSaw } from "../src/lib/saw.ts";
import {
  SEED_AHP_RESPONDENTS,
  SEED_AHP_UPPER_PAIRS,
  SEED_ALTERNATIVES,
  SEED_CRITERIA,
} from "../src/lib/seed-data.ts";
import { computeSensitivity } from "../src/lib/sensitivity.ts";
import type { Alternative, Criterion } from "../src/lib/types.ts";

function buildCriteriaFixtures(): Criterion[] {
  return SEED_CRITERIA.map((c, idx) => ({
    id: idx + 1,
    ...c,
  }));
}

function buildAlternativesFixtures(): Alternative[] {
  return SEED_ALTERNATIVES.map((a, idx) => ({
    id: idx + 1,
    ...a,
  }));
}

function buildSeedMatrix(criteria: Criterion[]): number[][] {
  return criteria.map((row) =>
    criteria.map((col) => {
      if (row.code === col.code) return 1;
      const direct = SEED_AHP_UPPER_PAIRS[`${row.code}:${col.code}`];
      if (direct !== undefined) return direct;
      const reverse = SEED_AHP_UPPER_PAIRS[`${col.code}:${row.code}`];
      if (reverse !== undefined) return 1 / reverse;
      throw new Error(`Missing pair ${row.code}:${col.code}`);
    })
  );
}

function assertClose(actual: number, expected: number, tolerance = 1e-7) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

test("Skor Kamera otomatis persis sama dengan rumus Excel Kelompok 12", () => {
  const expectedCameraScores: Record<string, number> = {
    A1: 68.33333333,
    A2: 69.66666667,
    A3: 69.66666667,
    A4: 28,
    A5: 84,
    A6: 55,
    A7: 51,
    A8: 75,
    A9: 65,
    A10: 65,
    A11: 75,
    A12: 66.33333333,
    A13: 57,
    A14: 84,
    A15: 53,
    A16: 65,
    A17: 55,
    A18: 66.33333333,
    A19: 30,
    A20: 55,
  };

  for (const alt of SEED_ALTERNATIVES) {
    const score = calculateCameraScore({
      camMainMp: alt.camMainMp,
      camUwMp: alt.camUwMp,
      camTeleMp: alt.camTeleMp,
      camFrontMp: alt.camFrontMp,
      camLens: alt.camLens,
      camOis: alt.camOis,
      camVideo: alt.camVideo,
    }).totalScore;
    assertClose(score, expectedCameraScores[alt.code], 1e-6);
  }
});

test("Perhitungan AHP menghasilkan bobot, lambda_max, CI, dan CR konsisten persis Excel", () => {
  const criteria = buildCriteriaFixtures();
  const matrix = buildSeedMatrix(criteria);
  const ahp = computeAhp(criteria, matrix);

  const expectedWeights = [
    0.3857521231,
    0.1789186827,
    0.1445885104,
    0.1694455547,
    0.08305320239,
    0.03824192665,
  ];

  ahp.weights.forEach((w, idx) => assertClose(w, expectedWeights[idx], 1e-8));
  assertClose(
    ahp.weights.reduce((a, b) => a + b, 0),
    1,
    1e-12
  );
  assertClose(ahp.lambdaMax, 6.554848747, 1e-7);
  assertClose(ahp.ci, 0.1109697493, 1e-7);
  assert.equal(ahp.ri, 1.24);
  assertClose(ahp.cr, 0.08949173333, 1e-7);
  assert.equal(ahp.isConsistent, true);
});

test("Perhitungan SAW dengan bobot AHP menghasilkan Vi dan ranking persis Excel", () => {
  const criteria = buildCriteriaFixtures();
  const alternatives = buildAlternativesFixtures();
  const ahp = computeAhp(criteria, buildSeedMatrix(criteria));
  const saw = computeSaw(criteria, alternatives, ahp.weights);

  const expectedSawVi: Record<string, number> = {
    A1: 0.7563261433,
    A2: 0.7223313008,
    A3: 0.7443473772,
    A4: 0.6290724405,
    A5: 0.6867366501,
    A6: 0.7536538503,
    A7: 0.7518328062,
    A8: 0.811307078,
    A9: 0.7427566088,
    A10: 0.8156799739,
    A11: 0.838232842,
    A12: 0.7346556317,
    A13: 0.7210649987,
    A14: 0.7570181089,
    A15: 0.6413862027,
    A16: 0.717611287,
    A17: 0.7259430721,
    A18: 0.6975380723,
    A19: 0.5739592758,
    A20: 0.6932670706,
  };

  for (const row of saw.rows) {
    assertClose(row.vi, expectedSawVi[row.code], 1e-7);
  }

  assert.equal(saw.rankings[0].code, "A11");
  assert.equal(saw.rankings[1].code, "A10");
  assert.equal(saw.rankings[2].code, "A8");
  assert.equal(saw.rankings[saw.rankings.length - 1].code, "A19");
});

test("Analisis sensitivitas menjaga total bobot = 1 dan mendeteksi perubahan peringkat", () => {
  const criteria = buildCriteriaFixtures();
  const alternatives = buildAlternativesFixtures();
  const ahp = computeAhp(criteria, buildSeedMatrix(criteria));

  const res = computeSensitivity(criteria, alternatives, ahp.weights, "C1", 0.65);
  assertClose(res.weightSum, 1, 1e-12);
  assertClose(res.adjustedWeights[0], 0.65, 1e-12);
  // Ketika bobot harga dinaikkan drastis menjadi 65%, A10 (Rp 4.999 jt) menyalip A11 (Rp 7.499 jt)
  assert.equal(res.winnerChanged, true);
  assert.equal(res.newWinnerCode, "A10");
});

test("Agregasi 10 responden kuesioner (tanpa Zakky) menghasilkan rata-rata AIP persis paper", () => {
  assert.equal(SEED_AHP_RESPONDENTS.length, 10);
  assert.ok(
    SEED_AHP_RESPONDENTS.every((r) => r.name.toLowerCase() !== "zakky"),
    "Duplikat Zakky tidak boleh masuk"
  );

  const criteria = buildCriteriaFixtures();
  const individualResults = SEED_AHP_RESPONDENTS.map((resp) =>
    computeAhp(criteria, buildMatrixFromUpperPairs(criteria, resp.upperPairs))
  );

  const avg = computeAhpAverageResult(criteria, individualResults);
  assert.equal(avg.respondentCount, 10);
  assert.equal(avg.consistentCount, 1);
  assertClose(avg.cr, 0.33651189, 1e-7);
  assert.equal(avg.isConsistent, false);
  assertClose(
    avg.weights.reduce((a, b) => a + b, 0),
    1,
    1e-12
  );

  const expectedAipWeights = [
    0.2020566, // Harga
    0.2516301, // Prosesor
    0.15030517, // RAM
    0.15848118, // Penyimpanan
    0.0723528, // Baterai
    0.16517415, // Kamera
  ];
  avg.weights.forEach((w, idx) => assertClose(w, expectedAipWeights[idx], 1e-7));
});

test("Audit R1 (Farrel Ega Nur Royyan) memakai rumus AHP Kelompok 12 (AVERAGE CV) secara akurat", () => {
  const criteria = buildCriteriaFixtures();
  const farrel = SEED_AHP_RESPONDENTS[0];
  assert.equal(farrel.code, "R1");
  assert.equal(farrel.name, "Farrel Ega Nur Royyan");
  assert.equal(farrel.upperPairs["C1:C2"], 1 / 7);
  assert.equal(farrel.upperPairs["C1:C6"], 1);

  const farrelAhp = computeAhp(
    criteria,
    buildMatrixFromUpperPairs(criteria, farrel.upperPairs)
  );

  const expectedColumnSums = [
    9.86666667,
    3.67619048,
    8.53333333,
    6.53333333,
    15.33333333,
    18,
  ];
  farrelAhp.columnSums.forEach((s, idx) =>
    assertClose(s, expectedColumnSums[idx], 1e-7)
  );

  const expectedWeights = [
    0.22210002,
    0.30484985,
    0.14468934,
    0.17813448,
    0.09897497,
    0.05125135,
  ];
  farrelAhp.weights.forEach((w, idx) =>
    assertClose(w, expectedWeights[idx], 1e-7)
  );

  assertClose(farrelAhp.lambdaMax, 7.99289343, 1e-7);
  assertClose(farrelAhp.ci, 0.39857869, 1e-7);
  assert.equal(farrelAhp.ri, 1.24);
  assertClose(farrelAhp.cr, 0.32143442, 1e-7);
  assert.equal(farrelAhp.isConsistent, false);
});

test("Bobot Geometric Mean (AIJ) 10 responden menghasilkan bobot konsisten dan total = 1", () => {
  const criteria = buildCriteriaFixtures();
  const individualResults = SEED_AHP_RESPONDENTS.map((resp) =>
    computeAhp(criteria, buildMatrixFromUpperPairs(criteria, resp.upperPairs))
  );
  const avg = computeAhpAverageResult(criteria, individualResults);
  const geo = avg.groupGeometricAhp;

  const expectedGeoWeights = [
    0.1961336, // Harga
    0.28096761, // Prosesor
    0.16477268, // RAM
    0.17622815, // Penyimpanan
    0.06726427, // Baterai
    0.11463368, // Kamera
  ];
  geo.weights.forEach((w, idx) => assertClose(w, expectedGeoWeights[idx], 1e-7));
  assertClose(
    geo.weights.reduce((a, b) => a + b, 0),
    1,
    1e-12
  );
  assert.equal(geo.isConsistent, true);
  assertClose(geo.cr, 0.06087807, 1e-7);
});
