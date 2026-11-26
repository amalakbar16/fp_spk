"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDecimal, formatPercent, formatSaatyValue } from "@/lib/format";
import type { AttributeType, Criterion, SpkPayload } from "@/lib/types";
import { AhpCalculationView } from "./AhpCalculationView";

export function AhpClient() {
  const [data, setData] = useState<SpkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editingCrit, setEditingCrit] = useState<Criterion | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/spk", { cache: "no-store" });
      const json = (await res.json()) as SpkPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || "Gagal memuat data AHP.");
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
        const res = await fetch("/api/spk", { cache: "no-store" });
        const json = (await res.json()) as SpkPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Gagal memuat data AHP.");
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

  const upperPairRows = useMemo(() => {
    if (!data) return [];
    const { criteria, respondents, ahp } = data;
    const rows: Array<{
      no: number;
      key: string;
      rowName: string;
      colName: string;
      geoValue: number;
      reciprocalValue: number;
      respondentValues: Array<{ code: string; value: number }>;
    }> = [];

    let no = 1;
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        const geoValue = ahp.pairwiseMatrix[i][j];
        rows.push({
          no: no++,
          key: `${criteria[i].code}:${criteria[j].code}`,
          rowName: criteria[i].name,
          colName: criteria[j].name,
          geoValue,
          reciprocalValue: 1 / geoValue,
          respondentValues: respondents.map((r) => ({
            code: r.code,
            value: r.ahp.pairwiseMatrix[i][j],
          })),
        });
      }
    }
    return rows;
  }, [data]);

  async function handleSaveCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCrit) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCrit),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui kriteria.");
      setEditingCrit(null);
      setNotice(`Kriteria ${editingCrit.code} berhasil diperbarui.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kriteria.");
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
        {error || "Gagal memuat halaman Geometric Mean & AHP."}
      </div>
    );
  }

  const { criteria, respondents, ahp } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Geometric Mean &amp; Perhitungan AHP
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Alur perhitungan berurutan: agregasi jawaban{" "}
            <strong>{respondents.length} responden</strong> menggunakan{" "}
            <strong>Geometric Mean</strong>, dimasukkan ke matriks{" "}
            <strong>Pairwise Comparison</strong>, normalisasi bobot prioritas,
            hingga uji konsistensi <strong>CR &le; 0,10</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border ${
              ahp.isConsistent
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {ahp.isConsistent ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="font-mono">
              CR = {formatDecimal(ahp.cr, 4)} ·{" "}
              {ahp.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
            </span>
          </span>
          <Link
            href="/responden"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            <span>Data Responden</span>
          </Link>
          <Link
            href="/saw"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <span>Perhitungan SAW</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
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

      {/* Bagian 1: Daftar Kriteria & Bobot Prioritas Akhir */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            1. Daftar Kriteria &amp; Bobot Prioritas Akhir (Hasil AHP)
          </h2>
          <p className="text-xs text-slate-500">
            Definisi kriteria beserta bobot akhir yang dihasilkan dari matriks
            Geometric Mean {respondents.length} responden.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Kode</th>
                <th className="py-2.5 px-3">Kriteria</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Satuan</th>
                <th className="py-2.5 px-3 text-right">Bobot Prioritas</th>
                <th className="py-2.5 px-3 text-right">Persentase</th>
                <th className="py-2.5 px-3">Keterangan Skala</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criteria.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                    {c.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                        c.attributeType === "cost"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {c.attributeType === "cost" ? "Cost" : "Benefit"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {c.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-semibold">
                    {formatDecimal(ahp.weights[idx] ?? 0, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-medium">
                    {formatPercent(ahp.weights[idx] ?? 0)}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-600 min-w-[240px]">
                    {c.scaleDescription}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingCrit({ ...c })}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 2: Perhitungan Geometric Mean dari Responden */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            2. Perhitungan Geometric Mean ({respondents.length} Responden)
          </h2>
          <p className="text-xs text-slate-500">
            Konversi jawaban kuesioner setiap responden ke skala Saaty (1–9),
            lalu hitung rata-rata geometrik tiap pasangan:{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              a_ij = (&prod; a_ij^(k))^(1/{respondents.length})
            </code>{" "}
            dan nilai resiprokalnya{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              a_ji = 1 / a_ij
            </code>
            .
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold">
                <th className="border border-slate-200 p-2 text-center">No</th>
                <th className="border border-slate-200 p-2 text-left whitespace-nowrap">
                  Pasangan Kriteria
                </th>
                {respondents.map((r) => (
                  <th
                    key={r.id}
                    className="border border-slate-200 p-2 text-center font-mono whitespace-nowrap"
                    title={`${r.code} · ${r.name}`}
                  >
                    {r.code}
                  </th>
                ))}
                <th className="border border-slate-200 p-2 text-right bg-indigo-50 text-indigo-900 whitespace-nowrap">
                  Geometric Mean (a<sub>ij</sub>)
                </th>
                <th className="border border-slate-200 p-2 text-right bg-slate-100 whitespace-nowrap">
                  Resiprokal (1 / a<sub>ij</sub>)
                </th>
              </tr>
            </thead>
            <tbody>
              {upperPairRows.map((pair) => (
                <tr key={pair.key} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 text-center font-mono text-slate-500">
                    {pair.no}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-700 mr-1.5">
                      {pair.key}
                    </span>
                    <span className="text-slate-600">
                      ({pair.rowName} vs {pair.colName})
                    </span>
                  </td>
                  {pair.respondentValues.map((rv) => (
                    <td
                      key={rv.code}
                      className="border border-slate-200 p-2 text-center font-mono text-slate-700"
                    >
                      {formatSaatyValue(rv.value)}
                    </td>
                  ))}
                  <td className="border border-slate-200 p-2 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                    {formatDecimal(pair.geoValue, 4)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right font-mono text-slate-600 bg-slate-50">
                    {formatDecimal(pair.reciprocalValue, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-600 rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5">
          Hasil 15 nilai <strong>Geometric Mean</strong> (segitiga atas) dan{" "}
          <strong>Resiprokal</strong> (segitiga bawah) di atas langsung
          dimasukkan ke dalam{" "}
          <strong>Matriks Perbandingan Berpasangan (Pairwise Comparison)</strong>{" "}
          pada Tahap 3 di bawah ini untuk dihitung bobot dan konsistensinya.
        </p>
      </section>

      {/* Bagian 3–5: Pairwise Comparison -> Normalisasi -> Uji Konsistensi */}
      <AhpCalculationView
        title="Matriks Perbandingan Berpasangan (Pairwise Comparison dari Geometric Mean)"
        subtitle="Nilai segitiga atas berasal langsung dari kolom Geometric Mean pada Tahap 2, dan segitiga bawah dari nilai resiprokalnya."
        criteria={criteria}
        ahp={ahp}
        editable={false}
        showFractionLabels={false}
        sectionOffset={3}
      />

      {/* Modal Edit Kriteria */}
      {editingCrit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 p-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Edit Kriteria {editingCrit.code}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCrit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCriterion} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kriteria
                </label>
                <input
                  type="text"
                  required
                  value={editingCrit.name}
                  onChange={(e) =>
                    setEditingCrit({ ...editingCrit, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Atribut
                  </label>
                  <select
                    value={editingCrit.attributeType}
                    onChange={(e) =>
                      setEditingCrit({
                        ...editingCrit,
                        attributeType: e.target.value as AttributeType,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="benefit">Benefit</option>
                    <option value="cost">Cost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCrit.unit}
                    onChange={(e) =>
                      setEditingCrit({ ...editingCrit, unit: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Definisi &amp; Skala Penilaian
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingCrit.scaleDescription}
                  onChange={(e) =>
                    setEditingCrit({
                      ...editingCrit,
                      scaleDescription: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCrit(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
