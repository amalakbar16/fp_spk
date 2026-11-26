export interface CameraSubSpecs {
  camMainMp: number;
  camUwMp: number;
  camTeleMp: number;
  camFrontMp: number;
  camLens: string;
  camOis: string;
  camVideo: string;
}

export interface CameraScoreBreakdown {
  skorUtama: number;
  skorLensa: number;
  skorOis: number;
  skorVideo: number;
  totalScore: number;
}

export const CAMERA_LENS_OPTIONS = [
  "Utama+UW+Tele",
  "Utama+UW+Makro",
  "Utama+UW",
  "Utama+Makro",
  "Utama",
] as const;

export const CAMERA_OIS_OPTIONS = ["Utama+Tele", "Utama", "Tidak"] as const;

export const CAMERA_VIDEO_OPTIONS = [
  "4K 60 fps",
  "4K 30 fps",
  "1080p 30 fps",
] as const;

/**
 * Konversi resolusi kamera (MP) ke skala 1-5 sesuai rumus Excel Kelompok 12.
 */
export function scoreMegapixels(mp: number): number {
  if (mp > 64) return 5;
  if (mp > 48) return 4;
  if (mp > 12) return 3;
  if (mp > 5) return 2;
  return 1;
}

/**
 * Menghitung skor total kamera (0-100) dari sub-kriteria resolusi, lensa, OIS, dan video.
 */
export function calculateCameraScore(specs: CameraSubSpecs): CameraScoreBreakdown {
  const uwCount = specs.camUwMp > 0 ? 1 : 0;
  const teleCount = specs.camTeleMp > 0 ? 1 : 0;

  const mpSum =
    scoreMegapixels(specs.camMainMp) +
    (uwCount ? scoreMegapixels(specs.camUwMp) : 0) +
    (teleCount ? scoreMegapixels(specs.camTeleMp) : 0) +
    scoreMegapixels(specs.camFrontMp);

  const skorUtama = mpSum / (2 + uwCount + teleCount);

  let skorLensa = 1;
  if (specs.camLens === "Utama+UW+Tele") skorLensa = 5;
  else if (specs.camLens === "Utama+UW+Makro") skorLensa = 4;
  else if (specs.camLens === "Utama+UW") skorLensa = 3;
  else if (specs.camLens === "Utama+Makro") skorLensa = 2;

  let skorOis = 1;
  if (specs.camOis === "Utama+Tele") skorOis = 5;
  else if (specs.camOis === "Utama") skorOis = 4;

  const videoUpper = specs.camVideo.toUpperCase();
  const has4K = videoUpper.includes("4K");
  const has60 = videoUpper.includes("60");
  let skorVideo = 1;
  if (has60 && has4K) skorVideo = 5;
  else if (has4K) skorVideo = 3;

  const totalScore =
    20 *
    (0.2 * skorUtama + 0.3 * skorLensa + 0.25 * skorOis + 0.25 * skorVideo);

  return {
    skorUtama,
    skorLensa,
    skorOis,
    skorVideo,
    totalScore,
  };
}
