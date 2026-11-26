import fs from "node:fs";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import {
  createDirectConnection,
  createPoolWithoutDatabase,
  getDbConfig,
} from "./db.ts";

export interface MigrationFile {
  version: string;
  name: string;
  filename: string;
  filePath: string;
}

export interface MigrationStatusItem {
  version: string;
  name: string;
  filename: string;
  status: "applied" | "pending";
  appliedAt: string | null;
}

function getMigrationsDir(): string {
  return path.resolve(process.cwd(), "database", "migrations");
}

export function listMigrationFiles(): MigrationFile[] {
  const dir = getMigrationsDir();
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((filename) => {
    const match = /^(\d+)_(.+)\.sql$/.exec(filename);
    const version = match ? match[1] : filename.replace(/\.sql$/, "");
    const name = match ? match[2] : filename;
    return {
      version,
      name,
      filename,
      filePath: path.join(dir, filename),
    };
  });
}

async function ensureDatabaseAndMigrationsTable(): Promise<void> {
  const cfg = getDbConfig();
  let conn;
  try {
    conn = await createDirectConnection({ includeDatabase: true });
  } catch (err) {
    const isUnknownDb =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "ER_BAD_DB_ERROR";
    if (!isUnknownDb) {
      throw err;
    }

    const bootstrapPool = createPoolWithoutDatabase();
    try {
      await bootstrapPool.query(
        `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } finally {
      await bootstrapPool.end();
    }
    conn = await createDirectConnection({ includeDatabase: true });
  }

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`version\` VARCHAR(100) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`applied_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_schema_migrations_version\` (\`version\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    await conn.end();
  }
}

export async function getMigrationStatus(): Promise<MigrationStatusItem[]> {
  await ensureDatabaseAndMigrationsTable();
  const conn = await createDirectConnection({ includeDatabase: true });

  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT version, applied_at FROM schema_migrations ORDER BY version ASC"
    );
    const appliedMap = new Map<string, string>();
    for (const r of rows) {
      appliedMap.set(String(r.version), String(r.applied_at));
    }

    return listMigrationFiles().map((m) => {
      const appliedAt = appliedMap.get(m.version) ?? null;
      return {
        version: m.version,
        name: m.name,
        filename: m.filename,
        status: appliedAt ? "applied" : "pending",
        appliedAt,
      };
    });
  } finally {
    await conn.end();
  }
}

/**
 * Menjalankan seluruh file SQL migration yang belum tercatat di tabel schema_migrations.
 */
export async function runMigrations(): Promise<{
  appliedNow: string[];
  alreadyApplied: string[];
}> {
  await ensureDatabaseAndMigrationsTable();
  const files = listMigrationFiles();
  const conn = await createDirectConnection({
    includeDatabase: true,
    multipleStatements: true,
  });

  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT version FROM schema_migrations"
    );
    const appliedVersions = new Set(rows.map((r) => String(r.version)));

    const appliedNow: string[] = [];
    const alreadyApplied: string[] = [];

    for (const file of files) {
      if (appliedVersions.has(file.version)) {
        alreadyApplied.push(file.filename);
        continue;
      }

      const sql = fs.readFileSync(file.filePath, "utf8").trim();
      if (sql) {
        await conn.query(sql);
      }

      await conn.query(
        "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
        [file.version, file.name]
      );
      appliedNow.push(file.filename);
    }

    return { appliedNow, alreadyApplied };
  } finally {
    await conn.end();
  }
}

export async function dropAllTablesForFreshMigration(): Promise<void> {
  await ensureDatabaseAndMigrationsTable();
  const conn = await createDirectConnection({ includeDatabase: true });

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("DROP TABLE IF EXISTS `ahp_respondent_comparisons`");
    await conn.query("DROP TABLE IF EXISTS `ahp_respondents`");
    await conn.query("DROP TABLE IF EXISTS `ahp_comparisons`");
    await conn.query("DROP TABLE IF EXISTS `alternatives`");
    await conn.query("DROP TABLE IF EXISTS `criteria`");
    await conn.query("DROP TABLE IF EXISTS `schema_migrations`");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    await conn.end();
  }
}
