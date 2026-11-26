"use client";

import {
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CAMERA_LENS_OPTIONS,
  CAMERA_OIS_OPTIONS,
  CAMERA_VIDEO_OPTIONS,
  calculateCameraScore,
} from "@/lib/camera-score";
import { formatDecimal, formatRupiah } from "@/lib/format";
import type { Alternative } from "@/lib/types";

interface AlternativesPayload {
  alternatives: Alternative[];
  nextCode: string;
}

interface AltFormState {
  id: number | null;
  code: string;
  name: string;
  price: string;
  processorScore: string;
  ramGb: string;
  storageGb: string;
  batteryMah: string;
  cameraMode: "specs" | "manual";
  cameraScore: string;
  camMainMp: string;
  camUwMp: string;
  camTeleMp: string;
  camFrontMp: string;
  camLens: string;
  camOis: string;
  camVideo: string;
}

function createEmptyForm(nextCode: string): AltFormState {
  return {
    id: null,
    code: nextCode,
    name: "",
    price: "6000000",
    processorScore: "900",
    ramGb: "8",
    storageGb: "256",
    batteryMah: "5000",
    cameraMode: "specs",
    cameraScore: "65",
    camMainMp: "50",
    camUwMp: "8",
    camTeleMp: "0",
    camFrontMp: "16",
    camLens: "Utama+UW",
    camOis: "Utama",
    camVideo: "4K 30 fps",
  };
}

function formFromAlternative(alt: Alternative): AltFormState {
  const hasSpecs = alt.camMainMp !== null;
  return {
    id: alt.id,
    code: alt.code,
    name: alt.name,
    price: String(alt.price),
    processorScore: String(alt.processorScore),
    ramGb: String(alt.ramGb),
    storageGb: String(alt.storageGb),
    batteryMah: String(alt.batteryMah),
    cameraMode: hasSpecs ? "specs" : "manual",
    cameraScore: String(Number(alt.cameraScore.toFixed(2))),
    camMainMp: String(alt.camMainMp ?? 50),
    camUwMp: String(alt.camUwMp ?? 0),
    camTeleMp: String(alt.camTeleMp ?? 0),
    camFrontMp: String(alt.camFrontMp ?? 16),
    camLens: alt.camLens ?? "Utama+UW",
    camOis: alt.camOis ?? "Utama",
    camVideo: alt.camVideo ?? "4K 30 fps",
  };
}

export function AlternativesClient() {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [nextCode, setNextCode] = useState("A21");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState<AltFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alternative | null>(null);

  async function fetchAlternatives() {
    try {
      const res = await fetch("/api/alternatives", { cache: "no-store" });
      const json = (await res.json()) as AlternativesPayload & {
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Gagal memuat alternatif.");
      setAlternatives(json.alternatives);
      setNextCode(json.nextCode);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/alternatives", { cache: "no-store" });
        const json = (await res.json()) as AlternativesPayload & {
          error?: string;
        };
        if (!res.ok) throw new Error(json.error || "Gagal memuat alternatif.");
        if (active) {
          setAlternatives(json.alternatives);
          setNextCode(json.nextCode);
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
    init();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return alternatives;
    return alternatives.filter(
      (a) =>
        a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [alternatives, search]);

  const cameraPreview = useMemo(() => {
    if (!form) return null;
    return calculateCameraScore({
      camMainMp: Number(form.camMainMp) || 0,
      camUwMp: Number(form.camUwMp) || 0,
      camTeleMp: Number(form.camTeleMp) || 0,
      camFrontMp: Number(form.camFrontMp) || 0,
      camLens: form.camLens,
      camOis: form.camOis,
      camVideo: form.camVideo,
    });
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        price: Number(form.price),
        processorScore: Number(form.processorScore),
        ramGb: Number(form.ramGb),
        storageGb: Number(form.storageGb),
        batteryMah: Number(form.batteryMah),
        cameraMode: form.cameraMode,
        cameraScore: Number(form.cameraScore),
        camMainMp: Number(form.camMainMp),
        camUwMp: Number(form.camUwMp),
        camTeleMp: Number(form.camTeleMp),
        camFrontMp: Number(form.camFrontMp),
        camLens: form.camLens,
        camOis: form.camOis,
        camVideo: form.camVideo,
      };

      const isEdit = form.id !== null;
      const url = isEdit
        ? `/api/alternatives/${form.id}`
        : "/api/alternatives";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        alternative?: Alternative;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data.");

      setNotice(
        isEdit
          ? `Data ${json.alternative?.code} (${json.alternative?.name}) berhasil diperbarui.`
          : `Data ${json.alternative?.code} (${json.alternative?.name}) berhasil ditambahkan.`
      );
      setForm(null);
      await fetchAlternatives();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/alternatives/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Gagal menghapus data.");
      setNotice(
        `Alternatif ${deleteTarget.code} (${deleteTarget.name}) telah dihapus.`
      );
      setDeleteTarget(null);
      await fetchAlternatives();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Data Alternatif Smartphone
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola daftar smartphone beserta nilai kriteria (Harga, Prosesor,
            RAM, Penyimpanan, Baterai, dan Skor Kamera otomatis).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setForm(createEmptyForm(nextCode));
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shrink-0 self-start md:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Alternatif</span>
        </button>
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

      {/* Tabel Alternatif */}
      <section className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">
            Menampilkan {filtered.length} dari {alternatives.length} alternatif
          </span>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode (A1) atau nama..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {loading && alternatives.length === 0 ? (
          <div className="h-48 rounded-lg bg-slate-100 animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Smartphone</th>
                  <th className="py-2.5 px-3 text-right">C1 · Harga</th>
                  <th className="py-2.5 px-3 text-right">C2 · Prosesor</th>
                  <th className="py-2.5 px-3 text-right">C3 · RAM</th>
                  <th className="py-2.5 px-3 text-right">C4 · Storage</th>
                  <th className="py-2.5 px-3 text-right">C5 · Baterai</th>
                  <th className="py-2.5 px-3 text-right">C6 · Kamera</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {alt.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-900">{alt.name}</p>
                      {alt.camMainMp !== null && (
                        <p className="text-[11px] text-slate-500">
                          {alt.camMainMp}MP · {alt.camLens} · OIS: {alt.camOis} ·{" "}
                          {alt.camVideo}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {formatRupiah(alt.price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {alt.processorScore.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {alt.ramGb} GB
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {alt.storageGb} GB
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {alt.batteryMah.toLocaleString("id-ID")} mAh
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-700">
                      {formatDecimal(alt.cameraScore, 2)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setForm(formFromAlternative(alt));
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(alt)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Tidak ada alternatif yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Tambah / Edit Alternatif */}
      {form && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white border border-slate-200 p-6 shadow-lg my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {form.id !== null
                  ? `Edit Alternatif ${form.code}`
                  : "Tambah Alternatif Smartphone Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode
                  </label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Smartphone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Samsung Galaxy A56 5G"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C1 · Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C2 · Prosesor (Ribu Poin)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={form.processorScore}
                    onChange={(e) =>
                      setForm({ ...form, processorScore: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C5 · Baterai (mAh)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={form.batteryMah}
                    onChange={(e) =>
                      setForm({ ...form, batteryMah: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C3 · RAM (GB)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={form.ramGb}
                    onChange={(e) => setForm({ ...form, ramGb: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C4 · Penyimpanan (GB)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={form.storageGb}
                    onChange={(e) =>
                      setForm({ ...form, storageGb: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Sub-Kriteria Kamera C6 */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase">
                      C6 · Perhitungan Skor Kamera
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Hitung otomatis dari spesifikasi kamera sesuai rumus Excel
                      atau masukkan skor langsung.
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cameraMode: "specs" })}
                      className={`px-2.5 py-1 rounded-md font-medium ${
                        form.cameraMode === "specs"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      Otomatis
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cameraMode: "manual" })}
                      className={`px-2.5 py-1 rounded-md font-medium ${
                        form.cameraMode === "manual"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {form.cameraMode === "specs" ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Utama (MP)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={form.camMainMp}
                          onChange={(e) =>
                            setForm({ ...form, camMainMp: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Ultrawide (MP)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={form.camUwMp}
                          onChange={(e) =>
                            setForm({ ...form, camUwMp: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Telephoto (MP)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={form.camTeleMp}
                          onChange={(e) =>
                            setForm({ ...form, camTeleMp: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Depan (MP)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={form.camFrontMp}
                          onChange={(e) =>
                            setForm({ ...form, camFrontMp: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Konfigurasi Lensa
                        </label>
                        <select
                          value={form.camLens}
                          onChange={(e) =>
                            setForm({ ...form, camLens: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        >
                          {CAMERA_LENS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          OIS
                        </label>
                        <select
                          value={form.camOis}
                          onChange={(e) =>
                            setForm({ ...form, camOis: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        >
                          {CAMERA_OIS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Video Maksimal
                        </label>
                        <select
                          value={form.camVideo}
                          onChange={(e) =>
                            setForm({ ...form, camVideo: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                        >
                          {CAMERA_VIDEO_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {cameraPreview && (
                      <div className="rounded-lg bg-white border border-indigo-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-600 space-x-2">
                          <span>
                            Utama: <b>{formatDecimal(cameraPreview.skorUtama, 2)}</b>
                          </span>
                          <span>·</span>
                          <span>
                            Lensa: <b>{cameraPreview.skorLensa}</b>
                          </span>
                          <span>·</span>
                          <span>
                            OIS: <b>{cameraPreview.skorOis}</b>
                          </span>
                          <span>·</span>
                          <span>
                            Video: <b>{cameraPreview.skorVideo}</b>
                          </span>
                        </div>
                        <div className="font-mono font-bold text-indigo-700 text-sm">
                          Skor Kamera ={" "}
                          {formatDecimal(cameraPreview.totalScore, 2)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Skor Kamera Manual (1–100)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      step="any"
                      value={form.cameraScore}
                      onChange={(e) =>
                        setForm({ ...form, cameraScore: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Alternatif"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Hapus Alternatif {deleteTarget.code}?
            </h3>
            <p className="text-sm text-slate-600">
              Anda yakin ingin menghapus{" "}
              <strong>{deleteTarget.name}</strong> dari database? Peringkat SAW
              akan otomatis menyesuaikan.
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
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
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
