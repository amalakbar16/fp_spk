import fs from "node:fs";
import type { SslOptions } from "mysql2";
import mysql, {
  type Connection,
  type Pool,
  type PoolOptions,
} from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: SslOptions | undefined;
}

function resolveSslConfig(
  host: string,
  urlParams?: URLSearchParams
): SslOptions | undefined {
  const rawSsl = process.env.DB_SSL?.trim().toLowerCase();
  if (rawSsl === "false" || rawSsl === "0") {
    return undefined;
  }

  const urlHasSsl =
    Boolean(urlParams?.get("ssl")) ||
    Boolean(urlParams?.get("sslmode")) ||
    Boolean(urlParams?.get("sslaccept"));
  const isTiDbCloud = host.toLowerCase().endsWith(".tidbcloud.com");
  const enabled = rawSsl === "true" || rawSsl === "1" || urlHasSsl || isTiDbCloud;

  if (!enabled) {
    return undefined;
  }

  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase() !== "false";
  const ssl: SslOptions = {
    minVersion: "TLSv1.2",
    rejectUnauthorized,
  };

  const caPath = process.env.DB_SSL_CA?.trim();
  if (caPath && fs.existsSync(caPath)) {
    ssl.ca = fs.readFileSync(caPath, "utf8");
  }

  return ssl;
}

export function getDbConfig(): DbConfig {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const parsed = new URL(databaseUrl);
    const rawName = parsed.pathname.replace(/^\/+/, "");
    const database = /^[a-zA-Z0-9_-]+$/.test(rawName)
      ? rawName
      : "fp_spk_smartphone";
    const host = parsed.hostname || "127.0.0.1";
    const port = Number(parsed.port || (host.endsWith(".tidbcloud.com") ? "4000" : "3306"));
    const user = decodeURIComponent(parsed.username || "root");
    const password = decodeURIComponent(parsed.password || "");
    return {
      host,
      port,
      user,
      password,
      database,
      ssl: resolveSslConfig(host, parsed.searchParams),
    };
  }

  const host = process.env.DB_HOST?.trim() || "127.0.0.1";
  const port = Number(
    process.env.DB_PORT?.trim() ||
      (host.toLowerCase().endsWith(".tidbcloud.com") ? "4000" : "3306")
  );
  const user = process.env.DB_USER?.trim() || "root";
  const password = process.env.DB_PASSWORD ?? "";
  const rawName = process.env.DB_NAME?.trim() || "fp_spk_smartphone";
  const database = /^[a-zA-Z0-9_-]+$/.test(rawName)
    ? rawName
    : "fp_spk_smartphone";

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: resolveSslConfig(host),
  };
}

function buildBaseOptions(cfg: DbConfig): PoolOptions {
  return {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    ...(cfg.ssl ? { ssl: cfg.ssl } : {}),
  };
}

const globalForMysql = globalThis as unknown as {
  __spkMysqlPool?: Pool;
  __spkDbReadyPromise?: Promise<void>;
};

export function createPoolWithoutDatabase(): Pool {
  const cfg = getDbConfig();
  return mysql.createPool({
    ...buildBaseOptions(cfg),
    waitForConnections: true,
    connectionLimit: 5,
  });
}

export async function createDirectConnection(options?: {
  includeDatabase?: boolean;
  multipleStatements?: boolean;
}): Promise<Connection> {
  const cfg = getDbConfig();
  return mysql.createConnection({
    ...buildBaseOptions(cfg),
    ...(options?.includeDatabase !== false ? { database: cfg.database } : {}),
    ...(options?.multipleStatements ? { multipleStatements: true } : {}),
  });
}

export function getPool(): Pool {
  if (!globalForMysql.__spkMysqlPool) {
    const cfg = getDbConfig();
    globalForMysql.__spkMysqlPool = mysql.createPool({
      ...buildBaseOptions(cfg),
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
    });
  }
  return globalForMysql.__spkMysqlPool;
}

export function getInitLockState() {
  return globalForMysql;
}
