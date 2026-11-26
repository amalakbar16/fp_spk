"use client";

import {
  Edit3,
  ExternalLink,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDecimal } from "@/lib/format";
import type {
  AhpAverageResult,
  AhpRespondent,
  Criterion,
} from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { RespondentModal } from "./RespondentModal";

interface RespondentsApiPayload {
  criteria: Criterion[];
  respondents: AhpRespondent[];
  average: AhpAverageResult;
  nextCode: string;
}

export function RespondentsClient() {
  const { setSourceKey } = useWeightSource();
  const [data, setData] = useState<RespondentsApiPayload | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRespondent, setEditingRespondent] =
    useState<AhpRespondent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AhpRespondent | null>(null);

  const loadRespondents = useCallback(async () => {
    try {
      const res = await fetch("/api/ahp/respondents", { cache: "no-store" });
      const json = (await res.json()) as RespondentsApiPayload & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat data responden.");
      }
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/ahp/respondents", { cache: "no-store" });
        const json = (await res.json()) as RespondentsApiPayload & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat data responden.");
        }
        if (active) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const filteredRespondents = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.respondents;
    return data.respondents.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
    );
  }, [data, search]);

  async function handleSaveRespondent(payload: {
    id: number | null;
    code: string;
    name: string;
    role: string;
    upperPairs: Record<string, number>;
  }) {
    try {
      setSaving(true);
      setModalError(null);
      setError(null);

      const url = payload.id
        ? `/api/ahp/respondents/${payload.id}`
        : "/api/ahp/respondents";
      const method = payload.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        respondent?: AhpRespondent;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan data responden.");
      }

      const savedCode = json.respondent?.code ?? payload.code;
      setModalOpen(false);
      setEditingRespondent(null);
      setNotice(
        payload.id
          ? `Data responden ${savedCode} (${payload.name}) berhasil diperbarui.`
          : `Responden baru ${savedCode} (${payload.name}) berhasil ditambahkan.`
      );
      await loadRespondents();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Gagal menyimpan responden."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/ahp/respondents/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Gagal menghapus responden.");

      const deletedCode = deleteTarget.code;
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      setNotice(`Responden ${deletedCode} (${deletedName}) berhasil dihapus.`);
      setSourceKey("average");
      await loadRespondents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus responden.");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetRespondents() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/ahp/respondents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Gagal mereset responden.");
      setNotice("Daftar responden dikembalikan ke 10 responden awal.");
      setSourceKey("average");
      await loadRespondents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset responden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
        {error || "Gagal memuat data responden."}
      </div>
    );
  }

  const { criteria, respondents, average, nextCode } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Responden Kuesioner AHP
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola responden dan 15 pasangan perbandingan Saaty. Setiap
            perubahan langsung memperbarui bobot rata-rata AIP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={handleResetRespondents}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset 10 Responden</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setError(null);
              setEditingRespondent(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Responden</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-sm text-indigo-900">
          {notice}
        </div>
      )}

      {/* Tabel Responden + Search */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-800">
              {filteredRespondents.length} dari {respondents.length} responden
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold font-mono ${
                average.isConsistent
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              Rata-rata CR = {formatDecimal(average.cr, 4)} ·{" "}
              {average.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
            </span>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode (R1), nama, atau peran..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold">
                <th className="border border-slate-200 p-2.5 text-left">
                  Kode
                </th>
                <th className="border border-slate-200 p-2.5 text-left">
                  Nama &amp; Peran
                </th>
                <th className="border border-slate-200 p-2.5 text-left whitespace-nowrap">
                  Waktu Pengisian
                </th>
                {criteria.map((c) => (
                  <th
                    key={c.id}
                    className="border border-slate-200 p-2.5 text-right whitespace-nowrap"
                  >
                    {c.code} · {c.name}
                  </th>
                ))}
                <th className="border border-slate-200 p-2.5 text-center whitespace-nowrap">
                  CR Individu
                </th>
                <th className="border border-slate-200 p-2.5 text-right whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRespondents.map((resp) => (
                <tr key={resp.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2.5 font-mono font-semibold text-slate-800">
                    {resp.code}
                  </td>
                  <td className="border border-slate-200 p-2.5">
                    <p className="font-semibold text-slate-900">{resp.name}</p>
                    <p className="text-[11px] text-slate-500">{resp.role}</p>
                  </td>
                  <td className="border border-slate-200 p-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {resp.submittedAt}
                  </td>
                  {resp.ahp.weights.map((w, j) => (
                    <td
                      key={criteria[j].id}
                      className="border border-slate-200 p-2.5 text-right font-mono text-slate-700"
                    >
                      {formatDecimal(w, 4)}
                    </td>
                  ))}
                  <td className="border border-slate-200 p-2.5 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border font-mono ${
                        resp.ahp.isConsistent
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {formatDecimal(resp.ahp.cr, 4)} ·{" "}
                      {resp.ahp.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
                    </span>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/ahp?source=${encodeURIComponent(resp.code)}`}
                        onClick={() => setSourceKey(resp.code)}
                        className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                        title="Lihat matriks AHP responden ini"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Detail</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setModalError(null);
                          setError(null);
                          setEditingRespondent(resp);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(resp)}
                        disabled={respondents.length <= 1 || saving}
                        title={
                          respondents.length <= 1
                            ? "Minimal 1 responden wajib tersisa"
                            : `Hapus ${resp.code}`
                        }
                        className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRespondents.length === 0 && (
                <tr>
                  <td
                    colSpan={criteria.length + 5}
                    className="border border-slate-200 py-8 text-center text-sm text-slate-500"
                  >
                    Tidak ada responden yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
              <tr className="bg-indigo-50 font-bold text-indigo-950">
                <td className="border border-slate-200 p-2.5 font-mono">AVG</td>
                <td className="border border-slate-200 p-2.5" colSpan={2}>
                  Rata-rata Bobot AIP (n = {respondents.length})
                </td>
                {average.weights.map((w, j) => (
                  <td
                    key={criteria[j].id}
                    className="border border-slate-200 p-2.5 text-right font-mono text-indigo-800"
                  >
                    {formatDecimal(w, 4)}
                  </td>
                ))}
                <td className="border border-slate-200 p-2.5 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border font-mono ${
                      average.isConsistent
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {formatDecimal(average.cr, 4)} ·{" "}
                    {average.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
                  </span>
                </td>
                <td className="border border-slate-200 p-2.5 text-right text-[11px] font-semibold text-indigo-700">
                  Acuan SAW
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Tambah / Edit Responden */}
      {modalOpen && (
        <RespondentModal
          criteria={criteria}
          initialRespondent={editingRespondent}
          nextCode={nextCode}
          saving={saving}
          error={modalError}
          onClose={() => {
            setModalOpen(false);
            setEditingRespondent(null);
            setModalError(null);
          }}
          onSave={handleSaveRespondent}
        />
      )}

      {/* Modal Konfirmasi Hapus Responden */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Hapus Responden {deleteTarget.code}?
            </h3>
            <p className="text-sm text-slate-600">
              Responden{" "}
              <strong>
                {deleteTarget.code} · {deleteTarget.name}
              </strong>{" "}
              akan dihapus dan bobot rata-rata otomatis dihitung ulang.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
