import { getPool } from "./db.ts";
import { ensureDatabaseInitialized, resetAndSeedDatabase } from "./seed.ts";

const shouldReset = process.argv.includes("--reset");

async function main() {
  if (shouldReset) {
    await resetAndSeedDatabase();
    console.log("Database fp_spk_smartphone di-reset dan di-seed ulang (6 kriteria, 20 alternatif).");
  } else {
    await ensureDatabaseInitialized();
    console.log("Database fp_spk_smartphone siap dan terisi data awal.");
  }
  await getPool().end();
}

main().catch((err) => {
  console.error("Gagal inisialisasi database:", err);
  process.exit(1);
});
