-- Skema referensi lengkap database fp_spk_smartphone.
-- Untuk pengelolaan terversi gunakan folder database/migrations/ via `npm run db:migrate`.

CREATE DATABASE IF NOT EXISTS `fp_spk_smartphone`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fp_spk_smartphone`;

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schema_migrations_version` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `criteria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `attribute_type` ENUM('benefit', 'cost') NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `scale_description` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_criteria_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ahp_comparisons` (
  `row_criterion_id` INT NOT NULL,
  `col_criterion_id` INT NOT NULL,
  `value` DOUBLE NOT NULL,
  PRIMARY KEY (`row_criterion_id`, `col_criterion_id`),
  CONSTRAINT `fk_ahp_row` FOREIGN KEY (`row_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ahp_col` FOREIGN KEY (`col_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `alternatives` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `price` DOUBLE NOT NULL,
  `processor_score` DOUBLE NOT NULL,
  `ram_gb` DOUBLE NOT NULL,
  `storage_gb` DOUBLE NOT NULL,
  `battery_mah` DOUBLE NOT NULL,
  `camera_score` DOUBLE NOT NULL,
  `cam_main_mp` DOUBLE NULL,
  `cam_uw_mp` DOUBLE NULL,
  `cam_tele_mp` DOUBLE NULL,
  `cam_front_mp` DOUBLE NULL,
  `cam_lens` VARCHAR(50) NULL,
  `cam_ois` VARCHAR(30) NULL,
  `cam_video` VARCHAR(30) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alternatives_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ahp_respondents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `submitted_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ahp_respondents_code` (`code`),
  UNIQUE KEY `uk_ahp_respondents_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ahp_respondent_comparisons` (
  `respondent_id` INT NOT NULL,
  `row_criterion_id` INT NOT NULL,
  `col_criterion_id` INT NOT NULL,
  `value` DOUBLE NOT NULL,
  PRIMARY KEY (`respondent_id`, `row_criterion_id`, `col_criterion_id`),
  CONSTRAINT `fk_resp_comp_respondent` FOREIGN KEY (`respondent_id`) REFERENCES `ahp_respondents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resp_comp_row` FOREIGN KEY (`row_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_resp_comp_col` FOREIGN KEY (`col_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
