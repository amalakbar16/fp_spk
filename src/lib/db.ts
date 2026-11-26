import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

export function getDbConfig() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || "3306");
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD ?? "";
  const rawName = process.env.DB_NAME || "fp_spk_smartphone";
  const database = /^[a-zA-Z0-9_]+$/.test(rawName)
    ? rawName
    : "fp_spk_smartphone";

  return { host, port, user, password, database };
}

const globalForMysql = globalThis as unknown as {
  __spkMysqlPool?: Pool;
  __spkDbReadyPromise?: Promise<void>;
};

export function createPoolWithoutDatabase(): Pool {
  const cfg = getDbConfig();
  const options: PoolOptions = {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    waitForConnections: true,
    connectionLimit: 5,
  };
  return mysql.createPool(options);
}

export function getPool(): Pool {
  if (!globalForMysql.__spkMysqlPool) {
    const cfg = getDbConfig();
    globalForMysql.__spkMysqlPool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
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
