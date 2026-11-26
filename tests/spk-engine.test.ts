import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatrixFromUpperPairs,
  computeAhp,
  computeGeometricMeanMatrix,
  computeGroupGeometricAhp,
} from "../src/lib/ahp.ts";
import { calculateCameraScore } from "../src/lib/camera-score.ts";
import { computeSaw } from "../src/lib/saw.ts";
import {
  SEED_AHP_RESPONDENTS,
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

function buildGroupGeometricAhpFixture() {
  const criteria = buildCriteriaFixtures();
  const individualResults = SEED_AHP_RESPONDENTS.map((resp) =>
    computeAhp(criteria, buildMatrixFromUpperPairs(criteria, resp.upperPairs))
  );
  return {
    criteria,
    individualResults,
    ahp: computeGroupGeometricAhp(criteria, individualResults),
  };
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

test("Data 10 responden dan nilai Geometric Mean cocok persis dengan sheet GEOMETRIC MEAN Excel", () => {
  assert.equal(SEED_AHP_RESPONDENTS.length, 10);
  assert.equal(SEED_AHP_RESPONDENTS[0].name, "Farrel Ega Nur Royyan");
  assert.equal(SEED_AHP_RESPONDENTS[9].name, "Auf");

  const criteria = buildCriteriaFixtures();
  const matrices = SEED_AHP_RESPONDENTS.map((resp) =>
    buildMatrixFromUpperPairs(criteria, resp.upperPairs)
  );
  const geoMatrix = computeGeometricMeanMatrix(matrices);

  const expectedUpperGeoMean = [
    1.144528397, // C1:C2
    1.501729387, // C1:C3
    1.355882107, // C1:C4
    1.822827208, // C1:C5
    1.488995286, // C1:C6
    2.41019946, // C2:C3
    2.536517482, // C2:C4
    3.838591654, // C2:C5
    1.67474166, // C2:C6
    0.7821775038, // C3:C4
    4.549279605, // C3:C5
    1.368030072, // C3:C6
    4.588185696, // C4:C5
    1.633177458, // C4:C6
    0.9109697688, // C5:C6
  ];

  let idx = 0;
  for (let i = 0; i < criteria.length; i++) {
    assert.equal(geoMatrix[i][i], 1);
    for (let j = i + 1; j < criteria.length; j++) {
      assertClose(geoMatrix[i][j], expectedUpperGeoMean[idx], 1e-8);
      assertClose(geoMatrix[j][i], 1 / expectedUpperGeoMean[idx], 1e-8);
      idx++;
    }
  }
});

test("Perhitungan AHP dari matriks Geometric Mean menghasilkan bobot, lambda_max, CI, dan CR persis Excel", () => {
  const { ahp } = buildGroupGeometricAhpFixture();

  const expectedColumnSums = [
    4.497340648,
    3.811292367,
    7.141204133,
    6.504831499,
    16.89661543,
    8.075914245,
  ];
  ahp.columnSums.forEach((s, idx) =>
    assertClose(s, expectedColumnSums[idx], 1e-7)
  );

  const expectedWeights = [
    0.2056070062, // Harga
    0.2697765209, // Prosesor
    0.1593071755, // RAM
    0.1789943075, // Penyimpanan
    0.07110118066, // Kapasitas Baterai
    0.1152138092, // Kamera
  ];
  ahp.weights.forEach((w, idx) => assertClose(w, expectedWeights[idx], 1e-8));
  assertClose(
    ahp.weights.reduce((a, b) => a + b, 0),
    1,
    1e-12
  );

  assertClose(ahp.lambdaMax, 6.341903491, 1e-7);
  assertClose(ahp.ci, 0.06838069812, 1e-7);
  assert.equal(ahp.ri, 1.24);
  assertClose(ahp.cr, 0.05514572429, 1e-7);
  assert.equal(ahp.isConsistent, true);
});

test("Perhitungan SAW dengan bobot Geometric Mean AHP menghasilkan Vi dan ranking persis Excel", () => {
  const { criteria, ahp } = buildGroupGeometricAhpFixture();
  const alternatives = buildAlternativesFixtures();
  const saw = computeSaw(criteria, alternatives, ahp.weights);

  const expectedSawVi: Record<string, number> = {
    A1: 0.7087799498,
    A2: 0.7049296619,
    A3: 0.7425090327,
    A4: 0.5678819495,
    A5: 0.6984680328,
    A6: 0.6834279001,
    A7: 0.6779415283,
    A8: 0.8473864251,
    A9: 0.7003029722,
    A10: 0.7475748421,
    A11: 0.894225442,
    A12: 0.7085893449,
    A13: 0.6594084737,
    A14: 0.7348244112,
    A15: 0.5501145457,
    A16: 0.7061227097,
    A17: 0.6792348202,
    A18: 0.6692177756,
    A19: 0.5067066539,
    A20: 0.6556959451,
  };

  for (const row of saw.rows) {
    assertClose(row.vi, expectedSawVi[row.code], 1e-7);
  }

  assert.equal(saw.rankings[0].code, "A11");
  assert.equal(saw.rankings[1].code, "A8");
  assert.equal(saw.rankings[2].code, "A10");
  assert.equal(saw.rankings[saw.rankings.length - 2].code, "A15");
  assert.equal(saw.rankings[saw.rankings.length - 1].code, "A19");
});

test("Audit R1 (Farrel Ega Nur Royyan) memakai rumus AHP Kelompok 12 (AVERAGE CV) secara akurat", () => {
  const criteria = buildCriteriaFixtures();
  const farrel = SEED_AHP_RESPONDENTS[0];
  assert.equal(farrel.code, "R1");
  assert.equal(farrel.name, "Farrel Ega Nur Royyan");

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

test("Analisis sensitivitas menjaga total bobot = 1 dan mendeteksi pergeseran pemenang", () => {
  const { criteria, ahp } = buildGroupGeometricAhpFixture();
  const alternatives = buildAlternativesFixtures();

  const res = computeSensitivity(criteria, alternatives, ahp.weights, "C1", 0.65);
  assertClose(res.weightSum, 1, 1e-12);
  assertClose(res.adjustedWeights[0], 0.65, 1e-12);
  assert.equal(res.winnerChanged, true);
  assert.equal(res.baseWinnerCode, "A11");
  assert.equal(res.newWinnerCode, "A10");
});
