"use client";

import { ArrowDown, ArrowUp, Minus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatCriterionRawValue,
  formatDecimal,
  formatPercent,
} from "@/lib/format";
import { computeSensitivity } from "@/lib/sensitivity";
import type { SpkPayload } from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { WeightSourceBar } from "./WeightSourceBar";

export function EvaluationClient() {
  const { sourceKey, setSourceKey, hydrated } = useWeightSource();
  const [data, setData] = useState<SpkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [targetCode, setTargetCode] = useState<string>("C1");
  const [sliderWeight, setSliderWeight] = useState<number>(0.2021);

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
        if (!res.ok) throw new Error(json.error || "Gagal memuat data evaluasi.");
        if (active) {
          setData(json);
          if (json.activeSource.key !== sourceKey) {
            setSourceKey(json.activeSource.key);
          }
          const weights = json.activeSource.weights;
          let maxIdx = 0;
          weights.forEach((w, idx) => {
            if (w > (weights[maxIdx] ?? 0)) maxIdx = idx;
          });
          setTargetCode(json.criteria[maxIdx]?.code ?? "C1");
          setSliderWeight(Number((weights[maxIdx] ?? 0).toFixed(4)));
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

  function handleSelectCriterion(code: string) {
    if (!data) return;
    setTargetCode(code);
    const idx = data.criteria.findIndex((c) => c.code === code);
    if (idx >= 0) {
      setSliderWeight(Number(data.activeSource.weights[idx].toFixed(4)));
    }
  }

  function handleResetSensitivity() {
    if (!data) return;
    const idx = data.criteria.findIndex((c) => c.code === targetCode);
    if (idx >= 0) {
      setSliderWeight(Number(data.activeSource.weights[idx].toFixed(4)));
    }
  }

  const sensitivity = useMemo(() => {
    if (!data || data.alternatives.length === 0) return null;
    return computeSensitivity(
      data.criteria,
      data.alternatives,
      data.activeSource.weights,
      targetCode,
      sliderWeight
    );
  }, [data, targetCode, sliderWeight]);

  const criteriaContributionStats = useMemo(() => {
    if (!data || data.saw.rankings.length === 0) return [];
    const top = data.saw.rankings[0];
    const bottom = data.saw.rankings[data.saw.rankings.length - 1];
    const nAlts = data.saw.rows.length;

    return data.criteria.map((c, j) => {
      const avgWeighted =
        data.saw.rows.reduce((acc, r) => acc + r.weightedValues[j], 0) / nAlts;
      return {
        criterion: c,
        weight: data.activeSource.weights[j],
        topWeighted: top.weightedValues[j],
        bottomWeighted: bottom.weightedValues[j],
        avgWeighted,
      };
    });
  }, [data]);

  const sortedTopCriteria = useMemo(() => {
    if (!data) return [];
    return data.criteria
      .map((c, idx) => ({ c, weight: data.activeSource.weights[idx] ?? 0 }))
      .sort((a, b) => b.weight - a.weight);
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

  if (!data || data.saw.rankings.length === 0) return null;

  const { criteria, saw, respondents, average, activeSource } = data;
  const topRow = saw.rankings[0];
  const bottomRow = saw.rankings[saw.rankings.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">
          Evaluasi Keputusan &amp; Analisis Sensitivitas
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Perbandingan peringkat tertinggi vs terendah, kontribusi bobot, dan
          simulasi sensitivitas (total bobot tetap = 1) menggunakan{" "}
          <strong>{activeSource.label}</strong>.
        </p>
      </section>

      <WeightSourceBar
        sourceKey={sourceKey}
        onChangeSource={setSourceKey}
        respondents={respondents}
        average={average}
        activeSource={activeSource}
      />

      {/* E.1 Analisis Peringkat Tertinggi vs Terendah */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            1. Analisis Peringkat Tertinggi dan Terendah
          </h2>
          <p className="text-xs text-slate-500">
            Perbandingan nilai kriteria antara alternatif peringkat #1 dan
            peringkat terakhir (#{bottomRow.rank}).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700">
                  Peringkat Tertinggi (#1)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {topRow.code} · {topRow.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Nilai Vi</span>
                <p className="font-mono text-lg font-bold text-emerald-700">
                  {formatDecimal(topRow.vi, 4)}
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {criteria.map((c, j) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b border-emerald-100 pb-1"
                >
                  <span className="text-slate-700">
                    {c.code} · {c.name}
                  </span>
                  <span className="font-mono text-slate-900">
                    {formatCriterionRawValue(c.code, topRow.rawValues[j])}{" "}
                    <span className="text-emerald-700">
                      (W×R: {formatDecimal(topRow.weightedValues[j], 4)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-rose-700">
                  Peringkat Terendah (#{bottomRow.rank})
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {bottomRow.code} · {bottomRow.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Nilai Vi</span>
                <p className="font-mono text-lg font-bold text-rose-700">
                  {formatDecimal(bottomRow.vi, 4)}
                </p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {criteria.map((c, j) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b border-rose-100 pb-1"
                >
                  <span className="text-slate-700">
                    {c.code} · {c.name}
                  </span>
                  <span className="font-mono text-slate-900">
                    {formatCriterionRawValue(c.code, bottomRow.rawValues[j])}{" "}
                    <span className="text-rose-700">
                      (W×R: {formatDecimal(bottomRow.weightedValues[j], 4)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E.2 Analisis Kontribusi Kriteria */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            2. Analisis Kontribusi Kriteria
          </h2>
          <p className="text-xs text-slate-500">
            Menunjukkan seberapa besar bobot AHP dan nilai terbobot tiap kriteria
            memengaruhi skor akhir pemenang, juru kunci, dan rata-rata seluruh
            alternatif.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase">
                <th className="border border-slate-200 p-2.5 text-left">
                  Kriteria
                </th>
                <th className="border border-slate-200 p-2.5 text-center">
                  Kategori
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Bobot AHP
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Kontribusi #{topRow.rank} ({topRow.code})
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Kontribusi #{bottomRow.rank} ({bottomRow.code})
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Rata-rata W×R
                </th>
              </tr>
            </thead>
            <tbody>
              {criteriaContributionStats.map((item) => (
                <tr key={item.criterion.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2.5 font-medium text-slate-900">
                    {item.criterion.code} · {item.criterion.name}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${
                        item.criterion.attributeType === "cost"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {item.criterion.attributeType === "cost"
                        ? "Cost"
                        : "Benefit"}
                    </span>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono font-semibold text-indigo-700">
                    {formatPercent(item.weight)}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono">
                    {formatDecimal(item.topWeighted, 4)}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono">
                    {formatDecimal(item.bottomWeighted, 4)}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono text-slate-700">
                    {formatDecimal(item.avgWeighted, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* E.3 Analisis Sensitivitas */}
      {sensitivity && (
        <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. Simulasi Analisis Sensitivitas (Total Bobot Tetap = 1)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih satu kriteria lalu ubah bobotnya; bobot kriteria lain
                otomatis diskalakan secara proporsional agar total bobot selalu
                sebesar 1,0000.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSensitivity}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-center"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset ke Bobot AHP</span>
            </button>
          </div>

          {/* Kontrol Sensitivitas */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kriteria yang Diuji
              </label>
              <select
                value={targetCode}
                onChange={(e) => handleSelectCriterion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {criteria.map((c, idx) => (
                  <option key={c.id} value={c.code}>
                    {c.code} · {c.name} (Awal:{" "}
                    {formatPercent(activeSource.weights[idx])})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Ubah Bobot {sensitivity.targetCriterionCode}</span>
                <span className="font-mono text-indigo-700">
                  {formatDecimal(sliderWeight, 4)} ({formatPercent(sliderWeight)})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.01}
                value={sliderWeight}
                onChange={(e) => setSliderWeight(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0.00</span>
                <span>0.45</span>
                <span>0.90</span>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-lg bg-white border border-slate-200 p-3 text-xs space-y-1">
              <p className="text-slate-500">Dampak Perubahan Bobot:</p>
              <p className="font-semibold text-slate-900">
                Peringkat #1:{" "}
                <span
                  className={
                    sensitivity.winnerChanged
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }
                >
                  {sensitivity.winnerChanged
                    ? `${sensitivity.baseWinnerCode} → ${sensitivity.newWinnerCode}`
                    : `Tetap ${sensitivity.baseWinnerCode}`}
                </span>
              </p>
              <p className="text-slate-600">
                Alternatif bergeser rank:{" "}
                <strong>
                  {sensitivity.changedRankCount} / {sensitivity.rows.length}
                </strong>
              </p>
            </div>
          </div>

          {/* Distribusi Bobot (Total = 1) + Tabel Perbandingan Rank */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-semibold text-slate-700">
                    <th className="border border-slate-200 p-2 text-left">
                      Kriteria
                    </th>
                    <th className="border border-slate-200 p-2 text-right">
                      Bobot Awal
                    </th>
                    <th className="border border-slate-200 p-2 text-right">
                      Bobot Uji
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={
                        c.code === sensitivity.targetCriterionCode
                          ? "bg-indigo-50/60 font-semibold"
                          : ""
                      }
                    >
                      <td className="border border-slate-200 p-2">
                        {c.code} · {c.name}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-mono">
                        {formatDecimal(sensitivity.baseWeights[idx], 4)}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-mono text-indigo-700">
                        {formatDecimal(sensitivity.adjustedWeights[idx], 4)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td className="border border-slate-200 p-2">TOTAL BOBOT</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">
                      1.0000
                    </td>
                    <td className="border border-slate-200 p-2 text-right font-mono text-emerald-700">
                      {formatDecimal(sensitivity.weightSum, 4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-8 overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-semibold text-slate-700">
                    <th className="border border-slate-200 p-2 text-left">
                      Kode
                    </th>
                    <th className="border border-slate-200 p-2 text-left">
                      Smartphone
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Rank Awal
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Rank Baru
                    </th>
                    <th className="border border-slate-200 p-2 text-center">
                      Selisih
                    </th>
                    <th className="border border-slate-200 p-2 text-right">
                      Vi Awal
                    </th>
                    <th className="border border-slate-200 p-2 text-right">
                      Vi Baru
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.rows.map((row) => (
                    <tr key={row.alternativeId} className="hover:bg-slate-50">
                      <td className="border border-slate-200 p-2 font-mono font-semibold">
                        {row.code}
                      </td>
                      <td className="border border-slate-200 p-2 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono">
                        #{row.baseRank}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono font-bold text-indigo-700">
                        #{row.newRank}
                      </td>
                      <td className="border border-slate-200 p-2 text-center">
                        {row.rankDelta > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                            <ArrowUp className="h-3 w-3" />+{row.rankDelta}
                          </span>
                        ) : row.rankDelta < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-700 font-semibold">
                            <ArrowDown className="h-3 w-3" />
                            {row.rankDelta}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-400">
                            <Minus className="h-3 w-3" />
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-mono">
                        {formatDecimal(row.baseVi, 4)}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-mono font-semibold">
                        {formatDecimal(row.newVi, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* E.4 Evaluasi Kesesuaian Keputusan */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-2">
        <h2 className="text-base font-bold text-slate-900">
          4. Evaluasi Kesesuaian Keputusan dengan Studi Kasus Mahasiswa
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Berdasarkan sumber bobot aktif (<strong>{activeSource.label}</strong>
          ) dengan prioritas utama pada{" "}
          <strong>
            {sortedTopCriteria[0]?.c.name} (
            {formatPercent(sortedTopCriteria[0]?.weight ?? 0)})
          </strong>{" "}
          dan{" "}
          <strong>
            {sortedTopCriteria[1]?.c.name} (
            {formatPercent(sortedTopCriteria[1]?.weight ?? 0)})
          </strong>
          , sistem merekomendasikan{" "}
          <strong>
            {topRow.name} ({topRow.code})
          </strong>{" "}
          sebagai peringkat #1 (Vi = {formatDecimal(topRow.vi, 4)}). Keputusan
          ini selaras dengan preferensi mahasiswa dalam menyeimbangkan kebutuhan
          spesifikasi utama dan efisiensi biaya dibanding alternatif dengan
          peringkat lebih rendah ({bottomRow.name}, Vi ={" "}
          {formatDecimal(bottomRow.vi, 4)}).
        </p>
      </section>
    </div>
  );
}
