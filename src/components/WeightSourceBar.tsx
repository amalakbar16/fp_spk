"use client";

import { AlertTriangle, CheckCircle2, GitMerge, User, Users } from "lucide-react";
import { formatDecimal } from "@/lib/format";
import type {
  AhpAverageResult,
  AhpRespondent,
  SpkWeightSourceInfo,
} from "@/lib/types";

interface WeightSourceBarProps {
  sourceKey: string;
  onChangeSource: (nextKey: string) => void;
  respondents: AhpRespondent[];
  average: AhpAverageResult;
  activeSource: SpkWeightSourceInfo;
}

export function WeightSourceBar({
  sourceKey,
  onChangeSource,
  respondents,
  average,
  activeSource,
}: WeightSourceBarProps) {
  const isAverage = activeSource.mode === "average";
  const isGeoMean = activeSource.mode === "geomean";
  const isRespondent = activeSource.mode === "respondent";

  const selectedRespondentCode = isRespondent
    ? activeSource.respondentCode || respondents[0]?.code || "R1"
    : respondents[0]?.code || "R1";

  const activeCr = activeSource.cr ?? average.cr;
  const activeConsistent = Boolean(activeSource.isConsistent);

  return (
    <section className="sticky top-2 sm:top-3 z-30 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 px-3.5 py-2.5 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500 mr-1">
            Sumber Bobot:
          </span>

          <button
            type="button"
            onClick={() => onChangeSource("average")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
              isAverage
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Rata-rata {respondents.length} Resp. (AIP)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSource("geomean")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
              isGeoMean
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Geometric Mean (AIJ)</span>
          </button>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 border transition-colors ${
              isRespondent
                ? "bg-indigo-50 border-indigo-400 text-indigo-900"
                : "bg-white border-slate-300 text-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => onChangeSource(selectedRespondentCode)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Responden:</span>
            </button>
            <select
              aria-label="Pilih Responden AHP"
              value={isRespondent ? sourceKey : selectedRespondentCode}
              onChange={(e) => onChangeSource(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 max-w-[260px] sm:max-w-[300px] cursor-pointer"
            >
              {respondents.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.code} · {r.name} (CR {formatDecimal(r.ahp.cr, 4)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border self-start xl:self-auto ${
            activeConsistent
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {activeConsistent ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          <span className="font-mono">CR = {formatDecimal(activeCr, 4)}</span>
          <span>·</span>
          <span>{activeConsistent ? "KONSISTEN" : "TIDAK KONSISTEN"}</span>
        </span>
      </div>
    </section>
  );
}
