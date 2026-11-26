"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { closestSaatyValue, SAATY_SCALE_OPTIONS } from "@/lib/ahp";
import { formatDecimal, formatPercent, formatSaatyValue } from "@/lib/format";
import type { AhpResult, Criterion } from "@/lib/types";

interface AhpCalculationViewProps {
  title: string;
  subtitle: string;
  criteria: Criterion[];
  ahp: AhpResult;
  editable?: boolean;
  showFractionLabels?: boolean;
  onPairChange?: (rowIdx: number, colIdx: number, value: number) => void;
  headerActions?: ReactNode;
  sectionOffset?: number;
}

export function AhpCalculationView({
  title,
  subtitle,
  criteria,
  ahp,
  editable = true,
  showFractionLabels = false,
  onPairChange,
  headerActions,
  sectionOffset = 2,
}: AhpCalculationViewProps) {
  return (
    <>
      {/* Matriks Perbandingan Berpasangan */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {sectionOffset}. {title}
            </h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          {headerActions && <div className="flex flex-wrap gap-2">{headerActions}</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Kriteria
                </th>
                {criteria.map((c) => (
                  <th
                    key={c.id}
                    className="border border-slate-200 p-2 text-center font-semibold text-slate-700 min-w-[100px]"
                  >
                    {c.code} · {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((rowCrit, i) => (
                <tr key={rowCrit.id}>
                  <th className="border border-slate-200 bg-slate-50 p-2 text-left font-semibold text-slate-800 whitespace-nowrap">
                    {rowCrit.code} · {rowCrit.name}
                  </th>
                  {criteria.map((colCrit, j) => {
                    const val = ahp.pairwiseMatrix[i][j];
                    if (i === j) {
                      return (
                        <td
                          key={colCrit.id}
                          className="border border-slate-200 bg-indigo-50/50 p-2 text-center font-mono font-bold text-indigo-800"
                        >
                          1
                        </td>
                      );
                    }
                    if (i < j && editable && onPairChange) {
                      const selectedVal = closestSaatyValue(val);
                      return (
                        <td
                          key={colCrit.id}
                          className="border border-slate-200 p-1.5 text-center"
                        >
                          <select
                            value={selectedVal}
                            onChange={(e) =>
                              onPairChange(i, j, Number(e.target.value))
                            }
                            className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 font-mono text-xs text-slate-900"
                            title={`${rowCrit.code} dibanding ${colCrit.code}`}
                          >
                            {SAATY_SCALE_OPTIONS.map((opt) => (
                              <option key={opt.label} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={colCrit.id}
                        className="border border-slate-200 bg-slate-50 p-2 text-center font-mono text-slate-700"
                        title={
                          i < j
                            ? `${rowCrit.code} vs ${colCrit.code}`
                            : `Resiprokal otomatis (1 / ${formatDecimal(
                                ahp.pairwiseMatrix[j][i],
                                4
                              )})`
                        }
                      >
                        {showFractionLabels
                          ? `${formatSaatyValue(val)} (${formatDecimal(val, 4)})`
                          : formatDecimal(val, 4)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold text-slate-800">
                <td className="border border-slate-200 p-2">TOTAL KOLOM</td>
                {ahp.columnSums.map((sum, j) => (
                  <td
                    key={criteria[j].id}
                    className="border border-slate-200 p-2 text-center font-mono"
                  >
                    {formatDecimal(sum, 4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Normalisasi Matriks & Bobot Prioritas */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {sectionOffset + 1}. Matriks Normalisasi &amp; Bobot Prioritas Kriteria
          </h2>
          <p className="text-xs text-slate-500">
            Setiap sel matriks perbandingan dibagi dengan jumlah kolomnya, lalu
            dirata-ratakan per baris menjadi Bobot Prioritas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                  Kriteria
                </th>
                {criteria.map((c) => (
                  <th
                    key={c.id}
                    className="border border-slate-200 p-2 text-center font-semibold text-slate-700"
                  >
                    {c.code}
                  </th>
                ))}
                <th className="border border-slate-200 p-2 text-center font-semibold text-indigo-800 bg-indigo-50">
                  Bobot Prioritas (w)
                </th>
                <th className="border border-slate-200 p-2 text-center font-semibold text-indigo-800 bg-indigo-50">
                  Persentase
                </th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((rowCrit, i) => (
                <tr key={rowCrit.id}>
                  <td className="border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-800 whitespace-nowrap">
                    {rowCrit.code} · {rowCrit.name}
                  </td>
                  {ahp.normalizedMatrix[i].map((val, j) => (
                    <td
                      key={criteria[j].id}
                      className="border border-slate-200 p-2 text-center font-mono text-slate-700"
                    >
                      {formatDecimal(val, 4)}
                    </td>
                  ))}
                  <td className="border border-slate-200 p-2 text-center font-mono font-bold text-indigo-700 bg-indigo-50/40">
                    {formatDecimal(ahp.weights[i], 6)}
                  </td>
                  <td className="border border-slate-200 p-2 text-center font-mono font-semibold text-slate-800 bg-indigo-50/40">
                    {formatPercent(ahp.weights[i])}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className="border border-slate-200 p-2">TOTAL</td>
                {criteria.map((c, j) => (
                  <td
                    key={c.id}
                    className="border border-slate-200 p-2 text-center font-mono"
                  >
                    {formatDecimal(
                      ahp.normalizedMatrix.reduce(
                        (acc, row) => acc + (row[j] ?? 0),
                        0
                      ),
                      4
                    )}
                  </td>
                ))}
                <td className="border border-slate-200 p-2 text-center font-mono text-indigo-800 bg-indigo-50">
                  {formatDecimal(
                    ahp.weights.reduce((acc, w) => acc + w, 0),
                    6
                  )}
                </td>
                <td className="border border-slate-200 p-2 text-center font-mono text-indigo-800 bg-indigo-50">
                  {formatPercent(
                    ahp.weights.reduce((acc, w) => acc + w, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Uji Konsistensi */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {sectionOffset + 2}. Uji Konsistensi Penilaian (Consistency Ratio)
            </h2>
            <p className="text-xs text-slate-500">
              Mengukur konsistensi perbandingan berpasangan melalui Weighted Sum
              Vector, Consistency Vector, &lambda;maks, CI, dan CR.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
              ahp.isConsistent
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {ahp.isConsistent ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              {ahp.isConsistent
                ? "KONSISTEN (CR ≤ 0,10)"
                : "TIDAK KONSISTEN (CR > 0,10)"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-2 text-left font-semibold text-slate-700">
                    Kriteria
                  </th>
                  <th className="border border-slate-200 p-2 text-right font-semibold text-slate-700">
                    Weighted Sum (A·w)
                  </th>
                  <th className="border border-slate-200 p-2 text-right font-semibold text-slate-700">
                    Bobot (w)
                  </th>
                  <th className="border border-slate-200 p-2 text-right font-semibold text-slate-700">
                    Consistency Vector
                  </th>
                </tr>
              </thead>
              <tbody>
                {ahp.consistencyRows.map((row) => (
                  <tr key={row.criterionId}>
                    <td className="border border-slate-200 p-2 font-medium text-slate-800">
                      {row.code} · {row.name}
                    </td>
                    <td className="border border-slate-200 p-2 text-right font-mono">
                      {formatDecimal(row.weightedSum, 6)}
                    </td>
                    <td className="border border-slate-200 p-2 text-right font-mono">
                      {formatDecimal(row.weight, 6)}
                    </td>
                    <td className="border border-slate-200 p-2 text-right font-mono font-semibold text-slate-900">
                      {formatDecimal(row.consistencyVector, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Jumlah Kriteria (n)</span>
                <span className="font-mono font-semibold">{ahp.n}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">&lambda;maks (Rata-rata CV)</span>
                <span className="font-mono font-semibold">
                  {formatDecimal(ahp.lambdaMax, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  CI = (&lambda;maks - n) / (n - 1)
                </span>
                <span className="font-mono font-semibold">
                  {formatDecimal(ahp.ci, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Random Index (RI untuk n={ahp.n})
                </span>
                <span className="font-mono font-semibold">
                  {formatDecimal(ahp.ri, 2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-900">CR = CI / RI</span>
                <span
                  className={`font-mono text-base font-bold ${
                    ahp.isConsistent ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatDecimal(ahp.cr, 4)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                Tabel Referensi Random Index (RI) Saaty:
              </p>
              <div className="grid grid-cols-5 gap-1 text-[11px] font-mono text-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
                  <div
                    key={k}
                    className={`rounded border px-1 py-1 ${
                      k === ahp.n
                        ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    n={k}: {ahp.riTable[k]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
