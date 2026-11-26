"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildMatrixFromUpperPairs,
  closestSaatyValue,
  computeAhp,
  SAATY_SCALE_OPTIONS,
} from "@/lib/ahp";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { AhpRespondent, Criterion } from "@/lib/types";

interface RespondentModalProps {
  criteria: Criterion[];
  initialRespondent: AhpRespondent | null;
  nextCode: string;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: {
    id: number | null;
    code: string;
    name: string;
    role: string;
    upperPairs: Record<string, number>;
  }) => Promise<void>;
}

function buildDefaultPairs(criteria: Criterion[]): Record<string, number> {
  const pairs: Record<string, number> = {};
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs[`${criteria[i].code}:${criteria[j].code}`] = 1;
    }
  }
  return pairs;
}

export function RespondentModal({
  criteria,
  initialRespondent,
  nextCode,
  saving,
  error,
  onClose,
  onSave,
}: RespondentModalProps) {
  const [code, setCode] = useState(initialRespondent?.code ?? nextCode);
  const [name, setName] = useState(initialRespondent?.name ?? "");
  const [role, setRole] = useState(
    initialRespondent?.role ?? "Mahasiswa Aktif"
  );
  const [upperPairs, setUpperPairs] = useState<Record<string, number>>(() => {
    const base = buildDefaultPairs(criteria);
    if (!initialRespondent) return base;
    for (const key of Object.keys(base)) {
      if (initialRespondent.upperPairs[key] !== undefined) {
        base[key] = closestSaatyValue(initialRespondent.upperPairs[key]);
      }
    }
    return base;
  });

  const pairItems = useMemo(() => {
    const items: Array<{ key: string; row: Criterion; col: Criterion }> = [];
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        items.push({
          key: `${criteria[i].code}:${criteria[j].code}`,
          row: criteria[i],
          col: criteria[j],
        });
      }
    }
    return items;
  }, [criteria]);

  const livePreview = useMemo(() => {
    if (criteria.length === 0) return null;
    const matrix = buildMatrixFromUpperPairs(criteria, upperPairs);
    return computeAhp(criteria, matrix);
  }, [criteria, upperPairs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      id: initialRespondent?.id ?? null,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      role: role.trim() || "Mahasiswa Aktif",
      upperPairs,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialRespondent
                ? `Edit Responden ${initialRespondent.code}`
                : "Tambah Responden Kuesioner AHP"}
            </h3>
            <p className="text-xs text-slate-500">
              Isi identitas dan 15 perbandingan berpasangan skala Saaty (1–9).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap / Inisial
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status / Peran
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {livePreview && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Pratinjau Otomatis Bobot &amp; Konsistensi Responden:
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border ${
                    livePreview.isConsistent
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {livePreview.isConsistent ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>
                    CR = {formatDecimal(livePreview.cr, 4)} ·{" "}
                    {livePreview.isConsistent
                      ? "KONSISTEN"
                      : "TIDAK KONSISTEN"}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {criteria.map((c, idx) => (
                  <div
                    key={c.id}
                    className="rounded border border-slate-200 bg-white px-2 py-1.5"
                  >
                    <p className="font-semibold text-slate-700 truncate">
                      {c.code} · {c.name}
                    </p>
                    <p className="font-mono font-bold text-indigo-700">
                      {formatPercent(livePreview.weights[idx])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              15 Pasangan Perbandingan Kriteria (Pertama vs Kedua)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {pairItems.map((item, idx) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-slate-200 p-2.5 space-y-1 bg-white"
                >
                  <label className="block text-xs font-medium text-slate-700">
                    {idx + 1}.{" "}
                    <span className="font-semibold text-slate-900">
                      {item.row.code} ({item.row.name})
                    </span>{" "}
                    vs{" "}
                    <span className="font-semibold text-slate-900">
                      {item.col.code} ({item.col.name})
                    </span>
                  </label>
                  <select
                    value={closestSaatyValue(upperPairs[item.key] ?? 1)}
                    onChange={(e) =>
                      setUpperPairs((prev) => ({
                        ...prev,
                        [item.key]: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono text-slate-900"
                  >
                    {SAATY_SCALE_OPTIONS.map((opt) => (
                      <option key={opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : initialRespondent
                ? "Simpan Perubahan"
                : "Tambah Responden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
