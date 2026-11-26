"use client";

import { AlertTriangle, CheckCircle2, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCriterionRawValue,
  formatDecimal,
  formatRupiah,
} from "@/lib/format";
import type { SpkPayload } from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { WeightSourceBar } from "./WeightSourceBar";

export function SawClient() {
  const { sourceKey, setSourceKey, hydrated } = useWeightSource();
  const [data, setData] = useState<SpkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/spk?source=${encodeURIComponent(sourceKey)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as SpkPayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Gagal memuat perhitungan SAW.");
        if (active) {
          setData(json);
          if (json.activeSource.key !== sourceKey) {
            setSourceKey(json.activeSource.key);
          }
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
    load();
    return () => {
      active = false;
    };
  }, [hydrated, sourceKey, setSourceKey]);

  const winnerFrequency = useMemo(() => {
    if (!data) return [];
    const respondentOnly = data.respondentTopSummaries.filter(
      (s) => s.mode === "respondent"
    );
    const map = new Map<
      string,
      { code: string; name: string; r1: number; r2: number; r3: number }
    >();
    for (const item of respondentOnly) {
      item.top3.forEach((entry, idx) => {
        const cur = map.get(entry.code) ?? {
          code: entry.code,
          name: entry.name,
          r1: 0,
          r2: 0,
          r3: 0,
        };
        if (idx === 0) cur.r1 += 1;
        else if (idx === 1) cur.r2 += 1;
        else if (idx === 2) cur.r3 += 1;
        map.set(entry.code, cur);
      });
    }
    return Array.from(map.values()).sort(
      (a, b) => b.r1 - a.r1 || b.r2 - a.r2 || b.r3 - a.r3
    );
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const {
    alternatives,
    saw,
    respondents,
    average,
    activeSource,
    respondentTopSummaries,
  } = data;
  const altById = new Map(alternatives.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Perhitungan &amp; Pemeringkatan SAW
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Tahapan normalisasi, perkalian bobot, dan pemeringkatan alternatif
              menggunakan <strong>{activeSource.label}</strong>.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border shrink-0 self-start sm:self-center ${
              activeSource.isConsistent
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {activeSource.isConsistent ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              {activeSource.label} · CR ={" "}
              {formatDecimal(activeSource.cr ?? average.cr, 4)} (
              {activeSource.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"})
            </span>
          </span>
        </div>
      </section>

      <WeightSourceBar
        sourceKey={sourceKey}
        onChangeSource={setSourceKey}
        respondents={respondents}
        average={average}
        activeSource={activeSource}
      />

      {/* Tahap 1: Matriks Keputusan (X) */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tahap 1 — Matriks Keputusan (X)
          </h2>
          <p className="text-xs text-slate-500">
            Data nilai asli setiap alternatif pada masing-masing kriteria beserta
            nilai Minimum (Cost) dan Maksimum (Benefit).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Kode
                </th>
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Alternatif
                </th>
                {saw.criteriaStats.map((stat) => (
                  <th
                    key={stat.criterionId}
                    className="border border-slate-200 p-2 text-right font-semibold text-slate-700 whitespace-nowrap"
                  >
                    {stat.code} · {stat.name} ({stat.attributeType === "cost" ? "Cost" : "Benefit"})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {saw.rows.map((row) => (
                <tr key={row.alternativeId} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-700">
                    {row.code}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    {row.name}
                  </td>
                  {row.rawValues.map((val, j) => (
                    <td
                      key={saw.criteriaStats[j].criterionId}
                      className="border border-slate-200 p-2 text-right font-mono text-slate-700 whitespace-nowrap"
                    >
                      {formatCriterionRawValue(saw.criteriaStats[j].code, val)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-amber-50/70 font-semibold text-amber-900">
                <td className="border border-slate-200 p-2" colSpan={2}>
                  Nilai Minimum (Acuan Cost)
                </td>
                {saw.criteriaStats.map((stat) => (
                  <td
                    key={stat.criterionId}
                    className="border border-slate-200 p-2 text-right font-mono whitespace-nowrap"
                  >
                    {formatCriterionRawValue(stat.code, stat.minValue)}
                  </td>
                ))}
              </tr>
              <tr className="bg-emerald-50/70 font-semibold text-emerald-900">
                <td className="border border-slate-200 p-2" colSpan={2}>
                  Nilai Maksimum (Acuan Benefit)
                </td>
                {saw.criteriaStats.map((stat) => (
                  <td
                    key={stat.criterionId}
                    className="border border-slate-200 p-2 text-right font-mono whitespace-nowrap"
                  >
                    {formatCriterionRawValue(stat.code, stat.maxValue)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tahap 2: Matriks Ternormalisasi (R) */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tahap 2 — Matriks Ternormalisasi (R)
          </h2>
          <p className="text-xs text-slate-500">
            Kriteria <b>Cost</b> dihitung dengan{" "}
            <code className="bg-slate-100 px-1 rounded">min(Xj) / Xij</code>;
            Kriteria <b>Benefit</b> dihitung dengan{" "}
            <code className="bg-slate-100 px-1 rounded">Xij / max(Xj)</code>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Kode
                </th>
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Alternatif
                </th>
                {saw.criteriaStats.map((stat) => (
                  <th
                    key={stat.criterionId}
                    className="border border-slate-200 p-2 text-right font-semibold text-slate-700"
                  >
                    {stat.code} ({stat.attributeType === "cost" ? "Min/X" : "X/Max"})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {saw.rows.map((row) => (
                <tr key={row.alternativeId} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-700">
                    {row.code}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    {row.name}
                  </td>
                  {row.normalizedValues.map((val, j) => (
                    <td
                      key={saw.criteriaStats[j].criterionId}
                      className="border border-slate-200 p-2 text-right font-mono text-slate-700"
                    >
                      {formatDecimal(val, 4)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tahap 3: Perkalian Bobot (W * R) & Nilai Preferensi (Vi) */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tahap 3 — Matriks Terbobot (W &times; R) &amp; Nilai Preferensi (Vi)
          </h2>
          <p className="text-xs text-slate-500">
            Setiap nilai ternormalisasi dikalikan dengan bobot AHP (
            <code className="bg-slate-100 px-1 rounded">wj &times; rij</code>),
            kemudian dijumlahkan menjadi Nilai Preferensi{" "}
            <code className="bg-slate-100 px-1 rounded">Vi</code>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Kode
                </th>
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Alternatif
                </th>
                {saw.criteriaStats.map((stat) => (
                  <th
                    key={stat.criterionId}
                    className="border border-slate-200 p-2 text-right font-semibold text-slate-700"
                  >
                    {stat.code} (w={formatDecimal(stat.weight, 4)})
                  </th>
                ))}
                <th className="border border-slate-200 p-2 text-right font-bold text-indigo-800 bg-indigo-50">
                  Total Vi
                </th>
              </tr>
            </thead>
            <tbody>
              {saw.rows.map((row) => (
                <tr key={row.alternativeId} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-700">
                    {row.code}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    {row.name}
                  </td>
                  {row.weightedValues.map((val, j) => (
                    <td
                      key={saw.criteriaStats[j].criterionId}
                      className="border border-slate-200 p-2 text-right font-mono text-slate-700"
                    >
                      {formatDecimal(val, 4)}
                    </td>
                  ))}
                  <td className="border border-slate-200 p-2 text-right font-mono font-bold text-indigo-700 bg-indigo-50/40">
                    {formatDecimal(row.vi, 6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tahap 4: Hasil Pemeringkatan Akhir */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tahap 4 — Hasil Pemeringkatan Akhir SAW
            </h2>
            <p className="text-xs text-slate-500">
              Diurutkan dari nilai preferensi Vi tertinggi hingga terendah.
            </p>
          </div>
          <Link
            href="/evaluasi"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Lanjut ke Evaluasi &amp; Analisis Sensitivitas →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                <th className="border border-slate-200 p-2.5 text-center">
                  Peringkat
                </th>
                <th className="border border-slate-200 p-2.5 text-left">Kode</th>
                <th className="border border-slate-200 p-2.5 text-left">
                  Smartphone
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Harga
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Prosesor
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  RAM / Storage
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Baterai
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Kamera
                </th>
                <th className="border border-slate-200 p-2.5 text-right bg-indigo-50 text-indigo-800">
                  Nilai Preferensi (Vi)
                </th>
              </tr>
            </thead>
            <tbody>
              {saw.rankings.map((row) => {
                const alt = altById.get(row.alternativeId);
                return (
                  <tr
                    key={row.alternativeId}
                    className={
                      row.rank === 1
                        ? "bg-amber-50/50"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td className="border border-slate-200 p-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          row.rank === 1
                            ? "bg-amber-100 text-amber-800"
                            : row.rank <= 3
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.rank === 1 && <Trophy className="h-3 w-3" />}#
                        {row.rank}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 font-mono text-xs font-semibold text-slate-700">
                      {row.code}
                    </td>
                    <td className="border border-slate-200 p-2.5 font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-xs whitespace-nowrap">
                      {alt ? formatRupiah(alt.price) : "-"}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-xs font-mono">
                      {alt ? alt.processorScore.toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-xs whitespace-nowrap">
                      {alt ? `${alt.ramGb} / ${alt.storageGb} GB` : "-"}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-xs whitespace-nowrap">
                      {alt ? `${alt.batteryMah.toLocaleString("id-ID")} mAh` : "-"}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right text-xs font-mono">
                      {alt ? formatDecimal(alt.cameraScore, 2) : "-"}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                      {formatDecimal(row.vi, 6)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tahap 5: Ringkasan Perbandingan Rekomendasi Per Responden (Tabel 3 & 4 Paper Acuan) */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tahap 5 — Perbandingan Top 3 Rekomendasi Antar Responden (Tabel 3
            &amp; 4 Paper Acuan)
          </h2>
          <p className="text-xs text-slate-500">
            Membandingkan hasil peringkat #1–#3 berdasarkan bobot rata-rata
            kelompok dan masing-masing responden. Klik <strong>Pakai</strong>{" "}
            untuk melihat seluruh detail tahapannya di atas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold uppercase">
                <th className="border border-slate-200 p-2.5 text-left">
                  Sumber Bobot
                </th>
                <th className="border border-slate-200 p-2.5 text-center">
                  CR
                </th>
                <th className="border border-slate-200 p-2.5 text-left">
                  Peringkat #1
                </th>
                <th className="border border-slate-200 p-2.5 text-left">
                  Peringkat #2
                </th>
                <th className="border border-slate-200 p-2.5 text-left">
                  Peringkat #3
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {respondentTopSummaries.map((item) => {
                const isActive = item.key === activeSource.key;
                return (
                  <tr
                    key={item.key}
                    className={
                      item.mode === "average"
                        ? "bg-indigo-50/70 font-semibold"
                        : isActive
                        ? "bg-amber-50/50"
                        : "hover:bg-slate-50"
                    }
                  >
                    <td className="border border-slate-200 p-2.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700 mr-1.5">
                        {item.code}
                      </span>
                      <span className="text-slate-900">{item.label}</span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-mono whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold ${
                          item.isConsistent
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {formatDecimal(item.cr ?? 0, 4)} ·{" "}
                        {item.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}
                      </span>
                    </td>
                    {[0, 1, 2].map((rankIdx) => {
                      const entry = item.top3[rankIdx];
                      return (
                        <td
                          key={rankIdx}
                          className="border border-slate-200 p-2.5 whitespace-nowrap"
                        >
                          {entry ? (
                            <span>
                              <strong className="text-slate-900">
                                {entry.code} · {entry.name}
                              </strong>{" "}
                              <span className="font-mono text-indigo-700">
                                ({formatDecimal(entry.vi, 4)})
                              </span>
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-slate-200 p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSourceKey(item.key)}
                        disabled={isActive}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold border ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600 cursor-default"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isActive ? "Sedang Aktif" : "Pakai"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rekap Frekuensi Smartphone di Top 3 Responden (ala Tabel 4 Paper Acuan) */}
        {winnerFrequency.length > 0 && (
          <div className="pt-2 space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-600">
              Rekap Frekuensi Kemunculan di 3 Besar Antar Responden (n ={" "}
              {respondents.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full max-w-2xl text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold">
                    <th className="border border-slate-200 p-2 text-left">
                      Smartphone
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Rank #1
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Rank #2
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Rank #3
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {winnerFrequency.map((wf) => (
                    <tr key={wf.code} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-medium text-slate-900">
                        <span className="font-mono font-bold mr-1.5 text-slate-700">
                          {wf.code}
                        </span>
                        {wf.name}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono font-bold text-amber-700">
                        {wf.r1}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        {wf.r2}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        {wf.r3}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
