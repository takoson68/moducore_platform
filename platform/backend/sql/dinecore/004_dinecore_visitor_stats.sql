CREATE TABLE IF NOT EXISTS site_visit_daily (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_date DATE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  path VARCHAR(255) NOT NULL,
  source_tag VARCHAR(32) NOT NULL DEFAULT 'direct',
  visit_count INT UNSIGNED NOT NULL DEFAULT 1,
  first_visited_at DATETIME NOT NULL,
  last_visited_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_visit_daily (visit_date, ip_address, path, source_tag),
  KEY idx_visit_date (visit_date),
  KEY idx_path (path),
  KEY idx_source_tag (source_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
