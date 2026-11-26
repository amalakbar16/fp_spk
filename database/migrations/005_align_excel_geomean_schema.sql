-- Migration 005: Penyelarasan skema dengan alur Geometric Mean -> Pairwise Comparison -> AHP -> SAW
-- mengacu pada file Excel: file tambahan/SPK - Kelompok 12 (3).xlsx.
-- Tabel manual legacy `ahp_comparisons` dihapus karena matriks Pairwise Comparison
-- dihitung langsung dari Geometric Mean seluruh responden (`ahp_respondents` & `ahp_respondent_comparisons`).

DROP TABLE IF EXISTS `ahp_comparisons`;
