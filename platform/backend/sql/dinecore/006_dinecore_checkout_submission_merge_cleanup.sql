CREATE TABLE IF NOT EXISTS dinecore_checkout_submissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(128) NOT NULL,
  client_submission_id VARCHAR(128) NOT NULL,
  table_code VARCHAR(32) NOT NULL,
  order_id INT UNSIGNED NULL,
  submitted_batch_id INT UNSIGNED NULL,
  submitted_batch_no INT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  response_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_dinecore_checkout_submissions_session_client (session_token, client_submission_id),
  INDEX idx_dinecore_checkout_submissions_table (table_code, created_at),
  CONSTRAINT fk_dinecore_checkout_submissions_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_checkout_submissions_batch
    FOREIGN KEY (submitted_batch_id) REFERENCES dinecore_order_batches(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_checkout_submissions_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_housekeeping_jobs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_key VARCHAR(64) NOT NULL UNIQUE,
  last_run_at DATETIME NULL,
  locked_until DATETIME NULL,
  meta_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dinecore_order_merge_records (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target_order_id INT UNSIGNED NOT NULL,
  merged_order_id INT UNSIGNED NOT NULL,
  table_code VARCHAR(32) NOT NULL,
  merged_by_user_id INT UNSIGNED NULL,
  reason VARCHAR(255) NOT NULL DEFAULT '',
  snapshot_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_dinecore_order_merge_records_pair (target_order_id, merged_order_id),
  INDEX idx_dinecore_order_merge_records_table (table_code, created_at),
  CONSTRAINT fk_dinecore_order_merge_target
    FOREIGN KEY (target_order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_order_merge_merged
    FOREIGN KEY (merged_order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_order_merge_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_order_merge_user
    FOREIGN KEY (merged_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

