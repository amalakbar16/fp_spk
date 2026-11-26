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
