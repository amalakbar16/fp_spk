export type AttributeType = "benefit" | "cost";

export interface Criterion {
  id: number;
  code: string;
  name: string;
  attributeType: AttributeType;
  unit: string;
  scaleDescription: string;
  sortOrder: number;
}

export interface Alternative {
  id: number;
  code: string;
  name: string;
  price: number;
  processorScore: number;
  ramGb: number;
  storageGb: number;
  batteryMah: number;
  cameraScore: number;
  camMainMp: number | null;
  camUwMp: number | null;
  camTeleMp: number | null;
  camFrontMp: number | null;
  camLens: string | null;
  camOis: string | null;
  camVideo: string | null;
}

export interface AhpConsistencyRow {
  criterionId: number;
  code: string;
  name: string;
  weight: number;
  weightedSum: number;
  consistencyVector: number;
}

export interface AhpResult {
  n: number;
  criteria: Criterion[];
  pairwiseMatrix: number[][];
  columnSums: number[];
  normalizedMatrix: number[][];
  weights: number[];
  weightedProductMatrix: number[][];
  consistencyRows: AhpConsistencyRow[];
  lambdaMax: number;
  ci: number;
  ri: number;
  cr: number;
  isConsistent: boolean;
  riTable: Record<number, number>;
}

export interface SawCriterionStat {
  criterionId: number;
  code: string;
  name: string;
  attributeType: AttributeType;
  unit: string;
  weight: number;
  minValue: number;
  maxValue: number;
}

export interface SawMatrixRow {
  alternativeId: number;
  code: string;
  name: string;
  rawValues: number[];
  normalizedValues: number[];
  weightedValues: number[];
  vi: number;
  rank: number;
}

export interface SawResult {
  criteriaStats: SawCriterionStat[];
  rows: SawMatrixRow[];
  rankings: SawMatrixRow[];
}

export interface SensitivityRow {
  alternativeId: number;
  code: string;
  name: string;
  baseRank: number;
  newRank: number;
  rankDelta: number;
  baseVi: number;
  newVi: number;
  viDelta: number;
}

export interface SensitivityResult {
  targetCriterionCode: string;
  targetCriterionName: string;
  baseWeight: number;
  newWeight: number;
  baseWeights: number[];
  adjustedWeights: number[];
  weightSum: number;
  changedRankCount: number;
  winnerChanged: boolean;
  baseWinnerCode: string;
  newWinnerCode: string;
  rows: SensitivityRow[];
}

export type WeightSourceMode = "average" | "geomean" | "respondent";

export interface AhpRespondent {
  id: number;
  code: string;
  name: string;
  role: string;
  submittedAt: string;
  upperPairs: Record<string, number>;
  ahp: AhpResult;
}

export interface AhpAverageResult {
  respondentCount: number;
  weights: number[];
  groupGeometricAhp: AhpResult;
}

export interface SpkWeightSourceInfo {
  key: string;
  mode: WeightSourceMode;
  label: string;
  respondentId: number | null;
  respondentCode: string | null;
  weights: number[];
  isConsistent: boolean | null;
  cr: number | null;
  ahp: AhpResult | null;
}

export interface RespondentTopSummary {
  key: string;
  code: string;
  label: string;
  mode: WeightSourceMode;
  cr: number | null;
  isConsistent: boolean | null;
  top3: Array<{
    rank: number;
    code: string;
    name: string;
    vi: number;
  }>;
}

export interface SpkPayload {
  criteria: Criterion[];
  ahp: AhpResult;
  alternatives: Alternative[];
  saw: SawResult;
  respondents: AhpRespondent[];
  average: AhpAverageResult;
  activeSource: SpkWeightSourceInfo;
  respondentTopSummaries: RespondentTopSummary[];
}
