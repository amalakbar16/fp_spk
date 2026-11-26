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
