import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getInitLockState, getPool } from "./db.ts";
import {
  dropAllTablesForFreshMigration,
  runMigrations,
} from "./migrate.ts";
import {
  SEED_AHP_RESPONDENTS,
  SEED_AHP_UPPER_PAIRS,
  SEED_ALTERNATIVES,
  SEED_CRITERIA,
} from "./seed-data.ts";

async function createTablesAndSeed(forceReset = false): Promise<void> {
  if (forceReset) {
    await dropAllTablesForFreshMigration();
  }

  await runMigrations();
  const pool = getPool();

  const [criteriaCountRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM criteria"
  );
  const criteriaCount = Number(criteriaCountRows[0]?.cnt ?? 0);

  if (criteriaCount === 0) {
    for (const c of SEED_CRITERIA) {
      await pool.query(
        `INSERT INTO criteria (code, name, attribute_type, unit, scale_description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          c.code,
          c.name,
          c.attributeType,
          c.unit,
          c.scaleDescription,
          c.sortOrder,
        ]
      );
    }
  }

  const [ahpCountRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM ahp_comparisons"
  );
  const ahpCount = Number(ahpCountRows[0]?.cnt ?? 0);

  if (ahpCount === 0) {
    await seedDefaultAhpComparisons();
  }

  const [altCountRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM alternatives"
  );
  const altCount = Number(altCountRows[0]?.cnt ?? 0);

  if (altCount === 0) {
    for (const alt of SEED_ALTERNATIVES) {
      await pool.query(
        `INSERT INTO alternatives (
          code, name, price, processor_score, ram_gb, storage_gb, battery_mah, camera_score,
          cam_main_mp, cam_uw_mp, cam_tele_mp, cam_front_mp, cam_lens, cam_ois, cam_video
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alt.code,
          alt.name,
          alt.price,
          alt.processorScore,
          alt.ramGb,
          alt.storageGb,
          alt.batteryMah,
          alt.cameraScore,
          alt.camMainMp,
          alt.camUwMp,
          alt.camTeleMp,
          alt.camFrontMp,
          alt.camLens,
          alt.camOis,
          alt.camVideo,
        ]
      );
    }
  }

  const [respCountRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM ahp_respondents"
  );
  const respCount = Number(respCountRows[0]?.cnt ?? 0);

  if (respCount === 0) {
    await seedDefaultAhpRespondents();
  }
}

export async function seedDefaultAhpRespondents(
  resetFirst = false
): Promise<void> {
  const pool = getPool();
  if (resetFirst) {
    await pool.query("DELETE FROM ahp_respondents");
  }
  const [criteriaRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, code FROM criteria ORDER BY sort_order ASC, id ASC"
  );
  const idByCode = new Map<string, number>();
  for (const row of criteriaRows) {
    idByCode.set(String(row.code), Number(row.id));
  }

  for (const resp of SEED_AHP_RESPONDENTS) {
    const [insertRes] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO ahp_respondents (code, name, role, submitted_at)
       VALUES (?, ?, ?, ?)`,
      [resp.code, resp.name, resp.role, resp.submittedAt]
    );

    let respondentId = Number(insertRes.insertId);
    if (!respondentId) {
      const [existing] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM ahp_respondents WHERE code = ?",
        [resp.code]
      );
      respondentId = Number(existing[0]?.id ?? 0);
    }
    if (!respondentId) continue;

    for (const [pairKey, value] of Object.entries(resp.upperPairs)) {
      const [rowCode, colCode] = pairKey.split(":");
      const rowId = idByCode.get(rowCode);
      const colId = idByCode.get(colCode);
      if (!rowId || !colId) continue;

      await pool.query(
        `INSERT IGNORE INTO ahp_respondent_comparisons (respondent_id, row_criterion_id, col_criterion_id, value)
         VALUES (?, ?, ?, ?)`,
        [respondentId, rowId, colId, value]
      );
    }
  }
}

export async function seedDefaultAhpComparisons(): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, code FROM criteria ORDER BY sort_order ASC, id ASC"
  );

  await pool.query("DELETE FROM ahp_comparisons");

  for (const row of rows) {
    const rowCode = String(row.code);
    const rowId = Number(row.id);
    for (const col of rows) {
      const colCode = String(col.code);
      const colId = Number(col.id);
      let val = 1;
      if (rowId !== colId) {
        const directKey = `${rowCode}:${colCode}`;
        const reverseKey = `${colCode}:${rowCode}`;
        if (SEED_AHP_UPPER_PAIRS[directKey] !== undefined) {
          val = SEED_AHP_UPPER_PAIRS[directKey];
        } else if (SEED_AHP_UPPER_PAIRS[reverseKey] !== undefined) {
          val = 1 / SEED_AHP_UPPER_PAIRS[reverseKey];
        }
      }
      await pool.query(
        `INSERT INTO ahp_comparisons (row_criterion_id, col_criterion_id, value)
         VALUES (?, ?, ?)`,
        [rowId, colId, val]
      );
    }
  }
}

export async function ensureDatabaseInitialized(): Promise<void> {
  const lockState = getInitLockState();
  if (!lockState.__spkDbReadyPromise) {
    lockState.__spkDbReadyPromise = createTablesAndSeed(false).catch((err) => {
      lockState.__spkDbReadyPromise = undefined;
      throw err;
    });
  }
  await lockState.__spkDbReadyPromise;
}

export async function resetAndSeedDatabase(): Promise<void> {
  const lockState = getInitLockState();
  lockState.__spkDbReadyPromise = createTablesAndSeed(true).catch((err) => {
    lockState.__spkDbReadyPromise = undefined;
    throw err;
  });
  await lockState.__spkDbReadyPromise;
}
