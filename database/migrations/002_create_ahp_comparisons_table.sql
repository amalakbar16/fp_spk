CREATE TABLE IF NOT EXISTS `ahp_comparisons` (
  `row_criterion_id` INT NOT NULL,
  `col_criterion_id` INT NOT NULL,
  `value` DOUBLE NOT NULL,
  PRIMARY KEY (`row_criterion_id`, `col_criterion_id`),
  CONSTRAINT `fk_ahp_row` FOREIGN KEY (`row_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ahp_col` FOREIGN KEY (`col_criterion_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
