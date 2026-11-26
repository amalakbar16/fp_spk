"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  GitMerge,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDecimal, formatPercent } from "@/lib/format";
import type {
  AttributeType,
  Criterion,
  SpkPayload,
} from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { AhpCalculationView } from "./AhpCalculationView";
import { WeightSourceBar } from "./WeightSourceBar";

export function AhpClient() {
  const { sourceKey, setSourceKey, hydrated } = useWeightSource();

  const [data, setData] = useState<SpkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editingCrit, setEditingCrit] = useState<Criterion | null>(null);
  const [showGeoDetail, setShowGeoDetail] = useState(false);

  const applyPayload = useCallback(
    (json: SpkPayload, targetSource: string) => {
      setData(json);
      if (json.activeSource.key !== targetSource) {
        setSourceKey(json.activeSource.key);
      }
      setError(null);
    },
    [setSourceKey]
  );

  const loadData = useCallback(
    async (targetSource: string) => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/spk?source=${encodeURIComponent(targetSource)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as SpkPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Gagal memuat data AHP.");
        applyPayload(json, targetSource);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    },
    [applyPayload]
  );

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    async function syncFetch() {
      try {
        const res = await fetch(
          `/api/spk?source=${encodeURIComponent(sourceKey)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as SpkPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Gagal memuat data AHP.");
        if (active) {
          applyPayload(json, sourceKey);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    syncFetch();
    return () => {
      active = false;
    };
  }, [hydrated, sourceKey, applyPayload]);

  const activeRespondent = useMemo(() => {
    if (!data || data.activeSource.mode !== "respondent") return null;
    return (
      data.respondents.find((r) => r.code === data.activeSource.respondentCode) ??
      null
    );
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
      await loadData(sourceKey);
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
        {error || "Gagal memuat halaman AHP."}
      </div>
    );
  }

  const { criteria, respondents, average, activeSource } = data;
  const activeWeights = activeSource.weights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Kriteria &amp; Transparansi Perhitungan AHP
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola definisi kriteria dan telusuri seluruh tahapan pembobotan AHP
            dari <strong>Rata-rata {respondents.length} Responden (AIP)</strong>,{" "}
            <strong>Geometric Mean (AIJ)</strong>, maupun rincian{" "}
            <strong>Per Responden</strong> secara transparan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
          <Link
            href="/geometric-mean"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <GitMerge className="h-4 w-4 text-indigo-600" />
            <span>Bandingkan GeoMean vs AIP</span>
          </Link>
          <Link
            href="/responden"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Users className="h-4 w-4" />
            <span>Kelola Data Responden</span>
          </Link>
        </div>
      </section>

      {/* Pemilih Sumber Bobot Terintegrasi */}
      <WeightSourceBar
        sourceKey={sourceKey}
        onChangeSource={(next) => {
          setNotice(null);
          setSourceKey(next);
        }}
        respondents={respondents}
        average={average}
        activeSource={activeSource}
      />

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

      {/* Bagian 1: Tabel Kriteria & Bobot Aktif */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            1. Daftar Kriteria, Atribut, dan Bobot Prioritas Aktif
          </h2>
          <p className="text-xs text-slate-500">
            Menampilkan definisi atribut (Benefit/Cost), satuan, skala
            penilaian, dan bobot aktif dari <strong>{activeSource.label}</strong>.
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
                <th className="py-2.5 px-3">Bobot Aktif</th>
                <th className="py-2.5 px-3">Persentase</th>
                <th className="py-2.5 px-3">Definisi &amp; Skala Penilaian</th>
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
                  <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">
                    {formatDecimal(activeWeights[idx] ?? 0, 4)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                    {formatPercent(activeWeights[idx] ?? 0)}
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

      {/* OPSI 1: RATA-RATA RESPONDEN (PAPER ACUAN) */}
      {activeSource.mode === "average" && (
        <>
          <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. Rekapitulasi Bobot AHP Seluruh Responden &amp; Rata-rata
                  Per Kriteria (Paper Acuan)
                </h2>
                <p className="text-xs text-slate-500">
                  Mengikuti Tabel 1 &amp; Tabel 2 Zulfahmi et al. (2026): setiap
                  responden dihitung bobot prioritas AHP-nya, lalu dirata-ratakan
                  per kriteria ({"\u0077\u0304"}
                  <sub>j</sub> = &Sigma;w<sub>k,j</sub> / {respondents.length}).
                </p>
              </div>
              <Link
                href="/responden"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0 self-start sm:self-center"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Tambah / Edit di Data Responden</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold">
                    <th className="border border-slate-200 p-2 text-left">
                      Kode
                    </th>
                    <th className="border border-slate-200 p-2 text-left">
                      Nama Responden
                    </th>
                    {criteria.map((c) => (
                      <th
                        key={c.id}
                        className="border border-slate-200 p-2 text-right whitespace-nowrap"
                      >
                        {c.code} · {c.name}
                      </th>
                    ))}
                    <th className="border border-slate-200 p-2 text-center">
                      CR Individu
                    </th>
                    <th className="border border-slate-200 p-2 text-right">
                      Telusuri AHP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {respondents.map((resp) => (
                    <tr key={resp.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-800">
                        {resp.code}
                      </td>
                      <td className="border border-slate-200 p-2">
                        <p className="font-semibold text-slate-900">
                          {resp.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {resp.role} · {resp.submittedAt}
                        </p>
                      </td>
                      {resp.ahp.weights.map((w, j) => (
                        <td
                          key={criteria[j].id}
                          className="border border-slate-200 p-2 text-right font-mono text-slate-700"
                        >
                          {formatDecimal(w, 4)}
                        </td>
                      ))}
                      <td className="border border-slate-200 p-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold border ${
                            resp.ahp.isConsistent
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {formatDecimal(resp.ahp.cr, 4)}
                        </span>
                      </td>
                      <td className="border border-slate-200 p-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSourceKey(resp.code)}
                          className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                          title="Lihat matriks dan seluruh tahapan AHP responden ini"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Detail Matriks</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Baris Rata-rata Bobot (Tabel 2 Paper Acuan) */}
                  <tr className="bg-indigo-50 font-bold text-indigo-950">
                    <td className="border border-slate-200 p-2.5 font-mono">
                      AVG
                    </td>
                    <td className="border border-slate-200 p-2.5">
                      Rata-rata Bobot Prioritas (n = {respondents.length})
                    </td>
                    {average.weights.map((w, j) => (
                      <td
                        key={criteria[j].id}
                        className="border border-slate-200 p-2.5 text-right font-mono text-indigo-800"
                      >
                        {formatDecimal(w, 4)}
                      </td>
                    ))}
                    <td className="border border-slate-200 p-2.5 text-center font-mono text-[11px] text-indigo-700">
                      Total = 1,0000
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-[11px] font-semibold text-indigo-700">
                      Aktif di SAW
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Verifikasi Konsistensi Kelompok Pendukung (Geometric Mean) */}
          <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. Verifikasi Konsistensi Kelompok (Pendukung)
                </h2>
                <p className="text-xs text-slate-600">
                  Karena metode rata-rata bobot per kriteria (Tabel 2 paper
                  acuan) tidak membentuk satu matriks tunggal, tabel ini
                  memverifikasi konsistensi kumpulan {respondents.length}{" "}
                  responden lewat agregasi matriks <i>Geometric Mean</i>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
                    average.groupGeometricAhp.isConsistent
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {average.groupGeometricAhp.isConsistent ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    CR Kelompok ={" "}
                    {formatDecimal(average.groupGeometricAhp.cr, 4)} (
                    {average.groupGeometricAhp.isConsistent
                      ? "KONSISTEN ≤ 0,10"
                      : "TIDAK KONSISTEN"}
                    )
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGeoDetail((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showGeoDetail ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>Tutup Matriks</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>Lihat Matriks</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showGeoDetail && (
              <div className="pt-2 space-y-6">
                <AhpCalculationView
                  title="Matriks Gabungan Geometric Mean Seluruh Responden"
                  subtitle="Dihitung hanya sebagai verifikasi konsistensi kelompok (bobot utama tetap memakai rata-rata per kriteria pada Bagian 2)."
                  criteria={criteria}
                  ahp={average.groupGeometricAhp}
                  editable={false}
                  sectionOffset={4}
                />
              </div>
            )}
          </section>
        </>
      )}

      {/* OPSI 2: GEOMETRIC MEAN (AIJ) */}
      {activeSource.mode === "geomean" && (
        <>
          <section className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-800">
                Mode Agregasi Kelompok Geometric Mean (AIJ)
              </p>
              <p className="text-sm font-bold text-slate-900">
                Matriks Gabungan {respondents.length} Responden · CR ={" "}
                {formatDecimal(average.groupGeometricAhp.cr, 4)} (
                {average.groupGeometricAhp.isConsistent
                  ? "KONSISTEN ≤ 0,10"
                  : "TIDAK KONSISTEN"}
                )
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceKey("average")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Rata-rata AIP</span>
              </button>
              <Link
                href="/geometric-mean"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <GitMerge className="h-3.5 w-3.5" />
                <span>Buka Perbandingan AIJ vs AIP</span>
              </Link>
            </div>
          </section>

          <AhpCalculationView
            title={`Matriks Gabungan Geometric Mean (${respondents.length} Responden · AIJ)`}
            subtitle="Setiap sel dibentuk dari rata-rata geometrik responden, lalu dihitung bobot prioritas dan uji konsistensi CR secara langsung pada satu matriks tunggal."
            criteria={criteria}
            ahp={average.groupGeometricAhp}
            editable={false}
          />
        </>
      )}

      {/* OPSI 3: PENELUSURAN DETAIL PER RESPONDEN */}
      {activeSource.mode === "respondent" && activeRespondent && (
        <>
          <section className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-indigo-700">
                Audit Perhitungan AHP Responden
              </p>
              <p className="text-sm font-bold text-slate-900">
                {activeRespondent.code} · {activeRespondent.name}{" "}
                <span className="font-normal text-slate-600">
                  ({activeRespondent.role} · {activeRespondent.submittedAt})
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSourceKey("average")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Rekap Rata-rata</span>
              </button>
              <Link
                href="/responden"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit di Data Responden</span>
              </Link>
            </div>
          </section>

          <AhpCalculationView
            title={`Matriks Perbandingan Berpasangan — ${activeRespondent.code} (${activeRespondent.name})`}
            subtitle="Penelusuran transparan jawaban kuesioner asli responden, normalisasi kolom, bobot prioritas, hingga uji konsistensi CR. Untuk mengubah jawaban responden, gunakan menu Data Responden."
            criteria={criteria}
            ahp={activeRespondent.ahp}
            editable={false}
          />
        </>
      )}

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
