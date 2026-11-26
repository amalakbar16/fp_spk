import {
  dropAllTablesForFreshMigration,
  getMigrationStatus,
  runMigrations,
} from "./migrate.ts";

const mode = process.argv[2] || "up";

async function main() {
  if (mode === "status") {
    const items = await getMigrationStatus();
    console.log("Status Migration MySQL:");
    for (const item of items) {
      console.log(
        `- [${item.status.toUpperCase()}] ${item.filename}${
          item.appliedAt ? ` (applied: ${item.appliedAt})` : ""
        }`
      );
    }
    return;
  }

  if (mode === "fresh") {
    await dropAllTablesForFreshMigration();
    console.log("Seluruh tabel dihapus untuk migration ulang.");
  }

  const res = await runMigrations();
  if (res.appliedNow.length === 0) {
    console.log(
      `Tidak ada migration baru (${res.alreadyApplied.length} sudah terpasang).`
    );
  } else {
    console.log("Migration berhasil dijalankan:");
    for (const file of res.appliedNow) {
      console.log(`- Applied: ${file}`);
    }
  }
}

main().catch((err) => {
  console.error("Gagal menjalankan migration:", err);
  process.exit(1);
});
