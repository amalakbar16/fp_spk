"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  GitMerge,
  Minus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatDecimal,
  formatPercent,
  formatSaatyValue,
} from "@/lib/format";
import { computeSaw } from "@/lib/saw";
import type { SpkPayload } from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { AhpCalculationView } from "./AhpCalculationView";

function rankIndicesDescending(values: number[]): number[] {
  const indexed = values.map((v, idx) => ({ v, idx }));
  indexed.sort((a, b) => b.v - a.v);
  const ranks = Array<number>(values.length).fill(1);
  indexed.forEach((item, pos) => {
    ranks[item.idx] = pos + 1;
  });
  return ranks;
}

export function GeometricMeanClient() {
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
        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat data Geometric Mean.");
        }
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
    void load();
    return () => {
      active = false;
    };
  }, [hydrated, sourceKey, setSourceKey]);

  const comparison = useMemo(() => {
    if (!data) return null;
    const { criteria, alternatives, respondents, average } = data;
    const geoAhp = average.groupGeometricAhp;
    const geoWeights = geoAhp.weights;
    const aipWeights = average.weights;

    const geoCritRanks = rankIndicesDescending(geoWeights);
    const aipCritRanks = rankIndicesDescending(aipWeights);

    const criteriaComparison = criteria.map((c, idx) => {
      const geoW = geoWeights[idx] ?? 0;
      const aipW = aipWeights[idx] ?? 0;
      return {
        criterion: c,
        geoWeight: geoW,
        aipWeight: aipW,
        delta: geoW - aipW,
        geoRank: geoCritRanks[idx],
        aipRank: aipCritRanks[idx],
      };
    });

    const sawGeo = computeSaw(criteria, alternatives, geoWeights);
    const sawAip = computeSaw(criteria, alternatives, aipWeights);
    const aipByAltId = new Map(
      sawAip.rows.map((r) => [r.alternativeId, r])
    );

    const sawComparisonRows = sawGeo.rankings.map((geoRow) => {
      const aipRow = aipByAltId.get(geoRow.alternativeId);
      const aipRank = aipRow?.rank ?? geoRow.rank;
      const aipVi = aipRow?.vi ?? geoRow.vi;
      return {
        alternativeId: geoRow.alternativeId,
        code: geoRow.code,
        name: geoRow.name,
        geoRank: geoRow.rank,
        geoVi: geoRow.vi,
        aipRank,
        aipVi,
        rankDelta: aipRank - geoRow.rank,
        viDelta: geoRow.vi - aipVi,
      };
    });

    const changedRankCount = sawComparisonRows.filter(
      (r) => r.rankDelta !== 0
    ).length;

    const upperPairRows: Array<{
      key: string;
      rowName: string;
      colName: string;
      geoValue: number;
      reciprocalValue: number;
      respondentValues: Array<{ code: string; value: number }>;
    }> = [];

    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        const key = `${criteria[i].code}:${criteria[j].code}`;
        const geoValue = geoAhp.pairwiseMatrix[i][j];
        upperPairRows.push({
          key,
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

    return {
      criteriaComparison,
      sawGeo,
      sawAip,
      sawComparisonRows,
      changedRankCount,
      upperPairRows,
    };
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

  if (!data || !comparison) return null;

  const { criteria, respondents, average, activeSource } = data;
  const geoAhp = average.groupGeometricAhp;
  const geoWinner = comparison.sawGeo.rankings[0];
  const aipWinner = comparison.sawAip.rankings[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Geometric Mean (AIJ) &amp; Perbandingan AIP
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Agregasi matriks {respondents.length} responden dengan{" "}
            <strong>Geometric Mean</strong> dibandingkan langsung dengan{" "}
            <strong>Rata-rata Bobot (AIP)</strong>.{" "}
            <span className="text-slate-500">
              (Sumber aktif di SAW: <strong>{activeSource.label}</strong>)
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSourceKey("geomean")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold border transition-colors ${
              activeSource.mode === "geomean"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <GitMerge className="h-4 w-4" />
            <span>
              {activeSource.mode === "geomean"
                ? "Geometric Mean Aktif"
                : "Pakai Geometric Mean"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSourceKey("average")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold border transition-colors ${
              activeSource.mode === "average"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>
              {activeSource.mode === "average"
                ? "Rata-rata AIP Aktif"
                : "Pakai Rata-rata AIP"}
            </span>
          </button>
        </div>
      </section>

      {/* 3 Kartu Ringkasan */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500">
            CR Rata-rata AIP ({respondents.length} Resp.)
          </p>
          <div className="flex items-center gap-1.5 text-lg font-bold text-slate-900 font-mono">
            {average.isConsistent ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>CR = {formatDecimal(average.cr, 4)}</span>
          </div>
          <p
            className={`text-xs font-semibold ${
              average.isConsistent ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {average.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"} (
            {average.consistentCount}/{respondents.length} resp. &le; 0,10)
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-xs space-y-1 ${
            geoAhp.isConsistent
              ? "bg-emerald-50/70 border-emerald-200"
              : "bg-amber-50/70 border-amber-200"
          }`}
        >
          <p className="text-xs font-bold uppercase text-emerald-800">
            CR Geometric Mean (AIJ)
          </p>
          <div className="flex items-center gap-1.5 text-lg font-bold text-slate-900 font-mono">
            {geoAhp.isConsistent ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>CR = {formatDecimal(geoAhp.cr, 4)}</span>
          </div>
          <p
            className={`text-xs font-semibold ${
              geoAhp.isConsistent ? "text-emerald-800" : "text-amber-800"
            }`}
          >
            {geoAhp.isConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"} (&lambda;maks
            = {formatDecimal(geoAhp.lambdaMax, 4)})
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs space-y-1">
          <p className="text-xs font-bold uppercase text-slate-500">
            Perbandingan #1 SAW (AIJ vs AIP)
          </p>
          <p className="text-sm font-bold text-slate-900">
            AIJ: {geoWinner?.code} · {geoWinner?.name}{" "}
            <span className="font-mono text-xs text-emerald-700">
              ({formatDecimal(geoWinner?.vi ?? 0, 4)})
            </span>
          </p>
          <p className="text-sm font-bold text-indigo-700">
            AIP: {aipWinner?.code} · {aipWinner?.name}{" "}
            <span className="font-mono text-xs">
              ({formatDecimal(aipWinner?.vi ?? 0, 4)})
            </span>
          </p>
          <p className="text-xs text-slate-600">
            {comparison.changedRankCount}/{comparison.sawComparisonRows.length}{" "}
            alternatif bergeser peringkat
          </p>
        </div>
      </section>

      {/* Bagian 1: Perbandingan Bobot Kriteria */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Perbandingan Bobot Kriteria (Geometric Mean vs AIP)
            </h2>
          </div>
          <Link
            href="/saw"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            <span>Lihat di Halaman SAW</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
                <th className="border border-slate-200 p-2.5 text-right bg-emerald-50/70 text-emerald-900">
                  Bobot AIJ (GeoMean)
                </th>
                <th className="border border-slate-200 p-2.5 text-center bg-emerald-50/70 text-emerald-900">
                  Rank
                </th>
                <th className="border border-slate-200 p-2.5 text-right bg-indigo-50/70 text-indigo-900">
                  Bobot AIP (Rata-rata)
                </th>
                <th className="border border-slate-200 p-2.5 text-center bg-indigo-50/70 text-indigo-900">
                  Rank
                </th>
                <th className="border border-slate-200 p-2.5 text-right">
                  Selisih (AIJ &minus; AIP)
                </th>
                <th className="border border-slate-200 p-2.5 min-w-[150px]">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.criteriaComparison.map((row) => {
                const maxBar = Math.max(row.geoWeight, row.aipWeight, 0.01);
                return (
                  <tr key={row.criterion.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2.5 font-medium text-slate-900 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700 mr-1.5">
                        {row.criterion.code}
                      </span>
                      {row.criterion.name}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${
                          row.criterion.attributeType === "cost"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {row.criterion.attributeType === "cost"
                          ? "Cost"
                          : "Benefit"}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                      {formatDecimal(row.geoWeight, 4)}{" "}
                      <span className="text-[11px] font-normal text-slate-500">
                        ({formatPercent(row.geoWeight)})
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-mono font-semibold bg-emerald-50/20">
                      #{row.geoRank}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-right font-mono font-bold text-indigo-800 bg-indigo-50/20">
                      {formatDecimal(row.aipWeight, 4)}{" "}
                      <span className="text-[11px] font-normal text-slate-500">
                        ({formatPercent(row.aipWeight)})
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-mono font-semibold bg-indigo-50/20">
                      #{row.aipRank}
                    </td>
                    <td
                      className={`border border-slate-200 p-2.5 text-right font-mono font-semibold ${
                        row.delta > 0.0001
                          ? "text-emerald-700"
                          : row.delta < -0.0001
                          ? "text-rose-700"
                          : "text-slate-500"
                      }`}
                    >
                      {row.delta >= 0 ? "+" : ""}
                      {formatDecimal(row.delta, 4)} (
                      {row.delta >= 0 ? "+" : ""}
                      {(row.delta * 100).toFixed(2)}%)
                    </td>
                    <td className="border border-slate-200 p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-6 font-mono text-emerald-700 font-bold">
                          AIJ
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(100, (row.geoWeight / Math.max(0.35, maxBar)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-6 font-mono text-indigo-700 font-bold">
                          AIP
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.min(100, (row.aipWeight / Math.max(0.35, maxBar)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 2: Perbandingan Peringkat SAW */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          2. Perbandingan Peringkat SAW (Geometric Mean vs AIP)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 font-semibold text-slate-700 uppercase">
                <th className="border border-slate-200 p-2 text-center">
                  Rank AIJ
                </th>
                <th className="border border-slate-200 p-2 text-center">
                  Rank AIP
                </th>
                <th className="border border-slate-200 p-2 text-center">
                  Selisih
                </th>
                <th className="border border-slate-200 p-2 text-left">Kode</th>
                <th className="border border-slate-200 p-2 text-left">
                  Smartphone
                </th>
                <th className="border border-slate-200 p-2 text-right bg-emerald-50/70 text-emerald-900">
                  Vi (AIJ)
                </th>
                <th className="border border-slate-200 p-2 text-right bg-indigo-50/70 text-indigo-900">
                  Vi (AIP)
                </th>
                <th className="border border-slate-200 p-2 text-right">
                  Selisih Vi
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.sawComparisonRows.map((row) => (
                <tr
                  key={row.alternativeId}
                  className={
                    row.geoRank === 1 ? "bg-amber-50/50" : "hover:bg-slate-50"
                  }
                >
                  <td className="border border-slate-200 p-2 text-center font-mono font-bold text-emerald-800">
                    #{row.geoRank}
                  </td>
                  <td className="border border-slate-200 p-2 text-center font-mono font-semibold text-indigo-800">
                    #{row.aipRank}
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
                  <td className="border border-slate-200 p-2 font-mono font-semibold text-slate-700">
                    {row.code}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="border border-slate-200 p-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                    {formatDecimal(row.geoVi, 4)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right font-mono font-semibold text-indigo-800 bg-indigo-50/20">
                    {formatDecimal(row.aipVi, 4)}
                  </td>
                  <td
                    className={`border border-slate-200 p-2 text-right font-mono ${
                      row.viDelta >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {row.viDelta >= 0 ? "+" : ""}
                    {formatDecimal(row.viDelta, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bagian 3: Penelusuran Pembentukan Sel Geometric Mean */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            3. Penelusuran Sel Geometric Mean dari {respondents.length}{" "}
            Responden
          </h2>
          <p className="text-xs text-slate-500">
            Nilai tiap pasangan dihitung dengan{" "}
            <code className="bg-slate-100 px-1 rounded">
              (&prod; a_ij^(k))^(1/{respondents.length})
            </code>
            .
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold">
                <th className="border border-slate-200 p-2 text-left whitespace-nowrap">
                  Pasangan Kriteria
                </th>
                {respondents.map((r) => (
                  <th
                    key={r.id}
                    className="border border-slate-200 p-2 text-center font-mono whitespace-nowrap"
                    title={r.name}
                  >
                    {r.code}
                  </th>
                ))}
                <th className="border border-slate-200 p-2 text-right bg-emerald-50 text-emerald-900 whitespace-nowrap">
                  GeoMean
                </th>
                <th className="border border-slate-200 p-2 text-right bg-slate-100 whitespace-nowrap">
                  Resiprokal
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.upperPairRows.map((pair) => (
                <tr key={pair.key} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 font-medium text-slate-900 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-700 mr-1">
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
                  <td className="border border-slate-200 p-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
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
      </section>

      {/* Bagian 4–6: Tahapan Lengkap AHP Matriks Geometric Mean */}
      <AhpCalculationView
        title={`Matriks Gabungan Geometric Mean (${respondents.length} Responden · AIJ)`}
        subtitle="Tahapan perhitungan bobot prioritas dan uji konsistensi CR dari matriks konsensus Geometric Mean."
        criteria={criteria}
        ahp={geoAhp}
        editable={false}
        sectionOffset={4}
      />
    </div>
  );
}
