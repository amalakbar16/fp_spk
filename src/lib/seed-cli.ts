import { getPool } from "./db.ts";
import { ensureDatabaseInitialized, resetAndSeedDatabase } from "./seed.ts";

const shouldReset = process.argv.includes("--reset");

async function main() {
  if (shouldReset) {
    await resetAndSeedDatabase();
    console.log(
      "Database fp_spk_smartphone di-reset dan di-seed ulang (6 kriteria, 10 responden Excel, 20 alternatif)."
    );
  } else {
    await ensureDatabaseInitialized();
    console.log(
      "Database fp_spk_smartphone siap dan terisi data awal sesuai Excel (6 kriteria, 10 responden, 20 alternatif)."
    );
  }
  await getPool().end();
}

main().catch((err) => {
  console.error("Gagal inisialisasi database:", err);
  process.exit(1);
});
