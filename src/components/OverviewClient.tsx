"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Scale,
  Smartphone,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatCriterionRawValue,
  formatDecimal,
  formatPercent,
  formatRupiah,
} from "@/lib/format";
import type { SpkPayload } from "@/lib/types";
import { useWeightSource } from "@/lib/use-weight-source";
import { WeightSourceBar } from "./WeightSourceBar";

export function OverviewClient() {
  const { sourceKey, setSourceKey, hydrated } = useWeightSource();
  const [data, setData] = useState<SpkPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          throw new Error(
            (json as { error?: string }).error || "Gagal memuat data SPK."
          );
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
    load();
    return () => {
      active = false;
    };
  }, [hydrated, sourceKey, setSourceKey]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900">
        <p className="font-semibold">Gagal Terhubung ke Server / Database</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const {
    criteria,
    alternatives,
    saw,
    respondents,
    average,
    activeSource,
  } = data;
  const topAlt = saw.rankings[0];
  const altById = new Map(alternatives.map((a) => [a.id, a]));
  const costCount = criteria.filter((c) => c.attributeType === "cost").length;
  const benefitCount = criteria.length - costCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              SPK Pemilihan Smartphone Bagi Mahasiswa
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Pembobotan kriteria menggunakan <strong>AHP</strong> (rata-rata
              bobot responden AIP) dan pemeringkatan alternatif menggunakan{" "}
              <strong>SAW</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href="/ahp"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Kriteria &amp; AHP</span>
            </Link>
            <Link
              href="/saw"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <span>Perhitungan SAW</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <WeightSourceBar
        sourceKey={sourceKey}
        onChangeSource={setSourceKey}
        respondents={respondents}
        average={average}
        activeSource={activeSource}
      />

      {/* 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>KRITERIA &amp; RESPONDEN</span>
            <Scale className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {criteria.length} Kriteria · {respondents.length} Resp.
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {costCount} Cost · {benefitCount} Benefit
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>DATA ALTERNATIF</span>
            <Smartphone className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {alternatives.length} Smartphone
          </p>
          <p className="mt-1 text-xs text-slate-600">
            <Link
              href="/alternatif"
              className="font-medium text-indigo-600 hover:underline"
            >
              Kelola data alternatif →
            </Link>
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>CONSISTENCY RATIO (AHP)</span>
            {activeSource.isConsistent ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            CR = {formatDecimal(activeSource.cr ?? average.cr, 4)}
          </p>
          <p
            className={`mt-1 text-xs font-semibold ${
              activeSource.isConsistent ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {activeSource.isConsistent
              ? "KONSISTEN (CR ≤ 0,10)"
              : "TIDAK KONSISTEN (CR > 0,10)"}
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>REKOMENDASI #1 (SAW)</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 truncate">
            {topAlt ? `${topAlt.code} · ${topAlt.name}` : "-"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Nilai Vi:{" "}
            <strong className="text-indigo-700">
              {topAlt ? formatDecimal(topAlt.vi, 4) : "-"}
            </strong>
          </p>
        </div>
      </section>

      {/* Bobot Kriteria + Top 5 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bobot Prioritas Kriteria
              </h2>
              <p className="text-xs text-slate-500">{activeSource.label}</p>
            </div>
            <Link
              href="/ahp"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Detail AHP →
            </Link>
          </div>
          <div className="space-y-3">
            {criteria.map((c, idx) => {
              const weight = activeSource.weights[idx] ?? 0;
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.code}
                      </span>
                      <span className="font-medium text-slate-800">
                        {c.name}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                          c.attributeType === "cost"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {c.attributeType === "cost" ? "Cost" : "Benefit"}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {formatPercent(weight)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.min(100, weight * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                5 Besar Rekomendasi Smartphone
              </h2>
              <p className="text-xs text-slate-500">
                Peringkat teratas berdasarkan nilai preferensi Vi
              </p>
            </div>
            <Link
              href="/saw"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Semua Peringkat →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Kode</th>
                  <th className="py-2 pr-3">Smartphone</th>
                  <th className="py-2 pr-3 text-right">Harga</th>
                  <th className="py-2 pr-3 text-right">Prosesor</th>
                  <th className="py-2 pr-3 text-right">Kamera</th>
                  <th className="py-2 text-right">Nilai Vi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saw.rankings.slice(0, 5).map((row) => {
                  const alt = altById.get(row.alternativeId);
                  return (
                    <tr key={row.alternativeId} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            row.rank === 1
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
                        {row.code}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-slate-700 whitespace-nowrap">
                        {alt ? formatRupiah(alt.price) : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-slate-700 whitespace-nowrap">
                        {alt
                          ? formatCriterionRawValue("C2", alt.processorScore)
                          : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-slate-700">
                        {alt
                          ? formatCriterionRawValue("C6", alt.cameraScore)
                          : "-"}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-indigo-700">
                        {formatDecimal(row.vi, 4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
