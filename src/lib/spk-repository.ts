import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  buildMatrixFromUpperPairs,
  computeAhp,
  computeGroupGeometricAhp,
} from "./ahp.ts";
import { calculateCameraScore } from "./camera-score.ts";
import { getPool } from "./db.ts";
import { computeSaw } from "./saw.ts";
import {
  ensureDatabaseInitialized,
  seedDefaultAhpRespondents,
} from "./seed.ts";
import type {
  AhpRespondent,
  Alternative,
  AttributeType,
  Criterion,
  SpkPayload,
} from "./types.ts";

interface CriterionRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  attribute_type: AttributeType;
  unit: string;
  scale_description: string;
  sort_order: number;
}

interface AhpRespondentRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  role: string;
  submitted_at: string | Date;
}

interface AhpRespondentComparisonRow extends RowDataPacket {
  respondent_id: number;
  row_criterion_id: number;
  col_criterion_id: number;
  value: number;
}

interface AlternativeRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  price: number;
  processor_score: number;
  ram_gb: number;
  storage_gb: number;
  battery_mah: number;
  camera_score: number;
  cam_main_mp: number | null;
  cam_uw_mp: number | null;
  cam_tele_mp: number | null;
  cam_front_mp: number | null;
  cam_lens: string | null;
  cam_ois: string | null;
  cam_video: string | null;
}

function mapCriterion(row: CriterionRow): Criterion {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    attributeType: row.attribute_type,
    unit: String(row.unit),
    scaleDescription: String(row.scale_description),
    sortOrder: Number(row.sort_order),
  };
}

function mapAlternative(row: AlternativeRow): Alternative {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    price: Number(row.price),
    processorScore: Number(row.processor_score),
    ramGb: Number(row.ram_gb),
    storageGb: Number(row.storage_gb),
    batteryMah: Number(row.battery_mah),
    cameraScore: Number(row.camera_score),
    camMainMp: row.cam_main_mp !== null ? Number(row.cam_main_mp) : null,
    camUwMp: row.cam_uw_mp !== null ? Number(row.cam_uw_mp) : null,
    camTeleMp: row.cam_tele_mp !== null ? Number(row.cam_tele_mp) : null,
    camFrontMp: row.cam_front_mp !== null ? Number(row.cam_front_mp) : null,
    camLens: row.cam_lens,
    camOis: row.cam_ois,
    camVideo: row.cam_video,
  };
}

export async function getAllCriteria(): Promise<Criterion[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const [rows] = await pool.query<CriterionRow[]>(
    "SELECT id, code, name, attribute_type, unit, scale_description, sort_order FROM criteria ORDER BY sort_order ASC, id ASC"
  );
  return rows.map(mapCriterion);
}

export async function updateCriterion(input: {
  id: number;
  name: string;
  attributeType: AttributeType;
  unit: string;
  scaleDescription: string;
}): Promise<Criterion[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  await pool.query(
    `UPDATE criteria
     SET name = ?, attribute_type = ?, unit = ?, scale_description = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.attributeType,
      input.unit.trim(),
      input.scaleDescription.trim(),
      input.id,
    ]
  );
  return getAllCriteria();
}

export async function getAllAlternatives(): Promise<Alternative[]> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const [rows] = await pool.query<AlternativeRow[]>(
    `SELECT id, code, name, price, processor_score, ram_gb, storage_gb, battery_mah, camera_score,
            cam_main_mp, cam_uw_mp, cam_tele_mp, cam_front_mp, cam_lens, cam_ois, cam_video
     FROM alternatives`
  );
  return rows
    .map(mapAlternative)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

export function computeNextAlternativeCode(alternatives: Alternative[]): string {
  let maxNum = 0;
  for (const alt of alternatives) {
    const match = /^A(\d+)$/i.exec(alt.code.trim());
    if (match) {
      const n = Number(match[1]);
      if (n > maxNum) maxNum = n;
    }
  }
  return `A${maxNum + 1}`;
}

export interface AlternativeInput {
  code?: string;
  name: string;
  price: number;
  processorScore: number;
  ramGb: number;
  storageGb: number;
  batteryMah: number;
  cameraMode?: "specs" | "manual";
  cameraScore?: number;
  camMainMp?: number | null;
  camUwMp?: number | null;
  camTeleMp?: number | null;
  camFrontMp?: number | null;
  camLens?: string | null;
  camOis?: string | null;
  camVideo?: string | null;
}

function resolveAlternativeValues(input: AlternativeInput) {
  const name = input.name?.trim();
  if (!name) {
    throw new Error("Nama smartphone wajib diisi.");
  }

  const numericChecks: Array<[string, number, boolean]> = [
    ["Harga", input.price, true],
    ["Prosesor", input.processorScore, true],
    ["RAM", input.ramGb, true],
    ["Penyimpanan", input.storageGb, true],
    ["Kapasitas Baterai", input.batteryMah, true],
  ];

  for (const [label, val, mustPositive] of numericChecks) {
    if (!Number.isFinite(val) || (mustPositive ? val <= 0 : val < 0)) {
      throw new Error(
        `${label} harus berupa angka ${mustPositive ? "lebih dari 0" : ">= 0"}.`
      );
    }
  }

  let cameraScore = Number(input.cameraScore ?? 0);
  const useSpecs = input.cameraMode !== "manual";

  const camMainMp = input.camMainMp ?? 50;
  const camUwMp = input.camUwMp ?? 0;
  const camTeleMp = input.camTeleMp ?? 0;
  const camFrontMp = input.camFrontMp ?? 16;
  const camLens = input.camLens || "Utama+UW";
  const camOis = input.camOis || "Utama";
  const camVideo = input.camVideo || "4K 30 fps";

  if (useSpecs) {
    cameraScore = calculateCameraScore({
      camMainMp,
      camUwMp,
      camTeleMp,
      camFrontMp,
      camLens,
      camOis,
      camVideo,
    }).totalScore;
  } else if (!Number.isFinite(cameraScore) || cameraScore <= 0 || cameraScore > 100) {
    throw new Error("Skor kamera manual harus berada pada rentang > 0 sampai 100.");
  }

  return {
    name,
    price: input.price,
    processorScore: input.processorScore,
    ramGb: input.ramGb,
    storageGb: input.storageGb,
    batteryMah: input.batteryMah,
    cameraScore,
    camMainMp: useSpecs ? camMainMp : null,
    camUwMp: useSpecs ? camUwMp : null,
    camTeleMp: useSpecs ? camTeleMp : null,
    camFrontMp: useSpecs ? camFrontMp : null,
    camLens: useSpecs ? camLens : null,
    camOis: useSpecs ? camOis : null,
    camVideo: useSpecs ? camVideo : null,
  };
}

export async function createAlternative(
  input: AlternativeInput
): Promise<Alternative> {
  await ensureDatabaseInitialized();
  const existing = await getAllAlternatives();
  const code = (input.code?.trim() || computeNextAlternativeCode(existing)).toUpperCase();
  const values = resolveAlternativeValues(input);

  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO alternatives (
      code, name, price, processor_score, ram_gb, storage_gb, battery_mah, camera_score,
      cam_main_mp, cam_uw_mp, cam_tele_mp, cam_front_mp, cam_lens, cam_ois, cam_video
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      values.name,
      values.price,
      values.processorScore,
      values.ramGb,
      values.storageGb,
      values.batteryMah,
      values.cameraScore,
      values.camMainMp,
      values.camUwMp,
      values.camTeleMp,
      values.camFrontMp,
      values.camLens,
      values.camOis,
      values.camVideo,
    ]
  );

  const [rows] = await pool.query<AlternativeRow[]>(
    `SELECT id, code, name, price, processor_score, ram_gb, storage_gb, battery_mah, camera_score,
            cam_main_mp, cam_uw_mp, cam_tele_mp, cam_front_mp, cam_lens, cam_ois, cam_video
     FROM alternatives WHERE id = ?`,
    [res.insertId]
  );
  return mapAlternative(rows[0]);
}

export async function updateAlternative(
  id: number,
  input: AlternativeInput
): Promise<Alternative> {
  await ensureDatabaseInitialized();
  const values = resolveAlternativeValues(input);
  const pool = getPool();
  const nextCode = input.code?.trim() ? input.code.trim().toUpperCase() : null;

  await pool.query(
    `UPDATE alternatives
     SET code = COALESCE(?, code),
         name = ?, price = ?, processor_score = ?, ram_gb = ?, storage_gb = ?, battery_mah = ?, camera_score = ?,
         cam_main_mp = ?, cam_uw_mp = ?, cam_tele_mp = ?, cam_front_mp = ?, cam_lens = ?, cam_ois = ?, cam_video = ?
     WHERE id = ?`,
    [
      nextCode,
      values.name,
      values.price,
      values.processorScore,
      values.ramGb,
      values.storageGb,
      values.batteryMah,
      values.cameraScore,
      values.camMainMp,
      values.camUwMp,
      values.camTeleMp,
      values.camFrontMp,
      values.camLens,
      values.camOis,
      values.camVideo,
      id,
    ]
  );

  const [rows] = await pool.query<AlternativeRow[]>(
    `SELECT id, code, name, price, processor_score, ram_gb, storage_gb, battery_mah, camera_score,
            cam_main_mp, cam_uw_mp, cam_tele_mp, cam_front_mp, cam_lens, cam_ois, cam_video
     FROM alternatives WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new Error("Alternatif tidak ditemukan.");
  }
  return mapAlternative(rows[0]);
}

export async function deleteAlternative(id: number): Promise<void> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const [res] = await pool.query<ResultSetHeader>(
    "DELETE FROM alternatives WHERE id = ?",
    [id]
  );
  if (res.affectedRows === 0) {
    throw new Error("Alternatif tidak ditemukan.");
  }
}

export interface AhpRespondentInput {
  code?: string;
  name: string;
  role?: string;
  submittedAt?: string;
  upperPairs: Record<string, number>;
}

function formatDatetimeForSql(input?: string): string {
  if (input?.trim()) {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
        parsed.getDate()
      )} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(
        parsed.getSeconds()
      )}`;
    }
  }
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatSqlDateString(value: string | Date): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
      value.getDate()
    )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
      value.getSeconds()
    )}`;
  }
  return String(value);
}

export function computeNextRespondentCode(
  respondents: Array<{ code: string }>
): string {
  let maxNum = 0;
  for (const r of respondents) {
    const match = /^R(\d+)$/i.exec(r.code.trim());
    if (match) {
      const n = Number(match[1]);
      if (n > maxNum) maxNum = n;
    }
  }
  return `R${maxNum + 1}`;
}

function normalizeUpperPairsInput(
  criteria: Criterion[],
  rawPairs: Record<string, number>
): Array<{ rowCriterionId: number; colCriterionId: number; key: string; value: number }> {
  if (!rawPairs || typeof rawPairs !== "object") {
    throw new Error("Data perbandingan berpasangan responden wajib diisi.");
  }

  const results: Array<{
    rowCriterionId: number;
    colCriterionId: number;
    key: string;
    value: number;
  }> = [];

  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      const rowCrit = criteria[i];
      const colCrit = criteria[j];
      const directKey = `${rowCrit.code}:${colCrit.code}`;
      const reverseKey = `${colCrit.code}:${rowCrit.code}`;

      let val = rawPairs[directKey];
      if (val === undefined && rawPairs[reverseKey] !== undefined) {
        val = 1 / Number(rawPairs[reverseKey]);
      }

      const numVal = Number(val ?? 1);
      if (!Number.isFinite(numVal) || numVal <= 0) {
        throw new Error(
          `Nilai perbandingan ${directKey} harus berupa angka lebih dari 0.`
        );
      }

      results.push({
        rowCriterionId: rowCrit.id,
        colCriterionId: colCrit.id,
        key: directKey,
        value: numVal,
      });
    }
  }

  return results;
}

export async function getAllAhpRespondents(
  preloadedCriteria?: Criterion[]
) {
  const criteria = preloadedCriteria ?? (await getAllCriteria());
  const pool = getPool();

  const [respRows] = await pool.query<AhpRespondentRow[]>(
    "SELECT id, code, name, role, submitted_at FROM ahp_respondents"
  );
  const [compRows] = await pool.query<AhpRespondentComparisonRow[]>(
    "SELECT respondent_id, row_criterion_id, col_criterion_id, value FROM ahp_respondent_comparisons"
  );

  const criterionById = new Map<number, Criterion>();
  const indexById = new Map<number, number>();
  criteria.forEach((c, idx) => {
    criterionById.set(c.id, c);
    indexById.set(c.id, idx);
  });

  const compsByResp = new Map<number, AhpRespondentComparisonRow[]>();
  for (const row of compRows) {
    const respId = Number(row.respondent_id);
    const list = compsByResp.get(respId) ?? [];
    list.push(row);
    compsByResp.set(respId, list);
  }

  const respondents: AhpRespondent[] = respRows
    .map((row) => {
      const id = Number(row.id);
      const upperPairs: Record<string, number> = {};
      const entries = compsByResp.get(id) ?? [];

      for (const comp of entries) {
        const rowId = Number(comp.row_criterion_id);
        const colId = Number(comp.col_criterion_id);
        const rowIdx = indexById.get(rowId);
        const colIdx = indexById.get(colId);
        const rowCrit = criterionById.get(rowId);
        const colCrit = criterionById.get(colId);
        const val = Number(comp.value);
        if (
          rowIdx === undefined ||
          colIdx === undefined ||
          !rowCrit ||
          !colCrit ||
          !Number.isFinite(val) ||
          val <= 0
        ) {
          continue;
        }
        if (rowIdx < colIdx) {
          upperPairs[`${rowCrit.code}:${colCrit.code}`] = val;
        } else if (colIdx < rowIdx) {
          upperPairs[`${colCrit.code}:${rowCrit.code}`] = 1 / val;
        }
      }

      const matrix = buildMatrixFromUpperPairs(criteria, upperPairs);
      const ahp = computeAhp(criteria, matrix);

      return {
        id,
        code: String(row.code),
        name: String(row.name),
        role: String(row.role),
        submittedAt: formatSqlDateString(row.submitted_at),
        upperPairs,
        ahp,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const groupAhp = computeGroupGeometricAhp(
    criteria,
    respondents.map((r) => r.ahp)
  );

  return {
    criteria,
    respondents,
    groupAhp,
  };
}

export async function createAhpRespondent(
  input: AhpRespondentInput
): Promise<AhpRespondent> {
  await ensureDatabaseInitialized();
  const name = input.name?.trim();
  if (!name) {
    throw new Error("Nama responden wajib diisi.");
  }

  const role = input.role?.trim() || "Mahasiswa Aktif";
  const submittedAt = formatDatetimeForSql(input.submittedAt);

  const { criteria, respondents } = await getAllAhpRespondents();
  const code = (
    input.code?.trim() || computeNextRespondentCode(respondents)
  ).toUpperCase();
  const pairs = normalizeUpperPairsInput(criteria, input.upperPairs);

  const pool = getPool();
  const conn = await pool.getConnection();
  let newId = 0;

  try {
    await conn.beginTransaction();
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO ahp_respondents (code, name, role, submitted_at)
       VALUES (?, ?, ?, ?)`,
      [code, name, role, submittedAt]
    );
    newId = res.insertId;

    for (const pair of pairs) {
      await conn.query(
        `INSERT INTO ahp_respondent_comparisons (respondent_id, row_criterion_id, col_criterion_id, value)
         VALUES (?, ?, ?, ?)`,
        [newId, pair.rowCriterionId, pair.colCriterionId, pair.value]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const updated = await getAllAhpRespondents(criteria);
  const created = updated.respondents.find((r) => r.id === newId);
  if (!created) {
    throw new Error("Gagal membaca data responden yang baru disimpan.");
  }
  return created;
}

export async function updateAhpRespondent(
  id: number,
  input: AhpRespondentInput
): Promise<AhpRespondent> {
  await ensureDatabaseInitialized();
  const name = input.name?.trim();
  if (!name) {
    throw new Error("Nama responden wajib diisi.");
  }

  const role = input.role?.trim() || "Mahasiswa Aktif";
  const nextCode = input.code?.trim() ? input.code.trim().toUpperCase() : null;
  const submittedAt = input.submittedAt
    ? formatDatetimeForSql(input.submittedAt)
    : null;

  const criteria = await getAllCriteria();
  const pairs = normalizeUpperPairsInput(criteria, input.upperPairs);

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const [res] = await conn.query<ResultSetHeader>(
      `UPDATE ahp_respondents
       SET code = COALESCE(?, code),
           name = ?,
           role = ?,
           submitted_at = COALESCE(?, submitted_at)
       WHERE id = ?`,
      [nextCode, name, role, submittedAt, id]
    );
    if (res.affectedRows === 0) {
      throw new Error("Responden tidak ditemukan.");
    }

    await conn.query(
      "DELETE FROM ahp_respondent_comparisons WHERE respondent_id = ?",
      [id]
    );

    for (const pair of pairs) {
      await conn.query(
        `INSERT INTO ahp_respondent_comparisons (respondent_id, row_criterion_id, col_criterion_id, value)
         VALUES (?, ?, ?, ?)`,
        [id, pair.rowCriterionId, pair.colCriterionId, pair.value]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const updated = await getAllAhpRespondents(criteria);
  const found = updated.respondents.find((r) => r.id === id);
  if (!found) {
    throw new Error("Responden tidak ditemukan.");
  }
  return found;
}

export async function deleteAhpRespondent(id: number): Promise<void> {
  await ensureDatabaseInitialized();
  const pool = getPool();
  const [countRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM ahp_respondents"
  );
  if (Number(countRows[0]?.cnt ?? 0) <= 1) {
    throw new Error("Minimal harus tersisa 1 responden kuesioner.");
  }

  const [res] = await pool.query<ResultSetHeader>(
    "DELETE FROM ahp_respondents WHERE id = ?",
    [id]
  );
  if (res.affectedRows === 0) {
    throw new Error("Responden tidak ditemukan.");
  }
}

export async function resetAhpRespondents() {
  await ensureDatabaseInitialized();
  await seedDefaultAhpRespondents(true);
  return getAllAhpRespondents();
}

export async function getFullSpkState(): Promise<SpkPayload> {
  const [criteria, alternatives] = await Promise.all([
    getAllCriteria(),
    getAllAlternatives(),
  ]);
  const { respondents, groupAhp } = await getAllAhpRespondents(criteria);
  const saw = computeSaw(criteria, alternatives, groupAhp.weights);

  return {
    criteria,
    respondents,
    ahp: groupAhp,
    alternatives,
    saw,
  };
}
