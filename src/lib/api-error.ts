import { NextResponse } from "next/server";

export function handleApiError(err: unknown) {
  const message =
    err instanceof Error ? err.message : "Terjadi kesalahan pada server.";

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "ER_DUP_ENTRY"
  ) {
    const duplicateMessage = message.includes("uk_ahp_respondents_name")
      ? "Nama responden sudah terdaftar. Gunakan nama lain agar tidak duplikat."
      : "Kode sudah digunakan. Gunakan kode lain yang unik.";
    return NextResponse.json({ error: duplicateMessage }, { status: 409 });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "ECONNREFUSED"
  ) {
    return NextResponse.json(
      {
        error:
          "Koneksi ke MySQL Laragon gagal. Pastikan layanan MySQL di Laragon sudah dijalankan.",
      },
      { status: 503 }
    );
  }

  const status = message.includes("tidak ditemukan") ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}
