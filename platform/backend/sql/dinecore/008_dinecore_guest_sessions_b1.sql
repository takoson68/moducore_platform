CREATE TABLE IF NOT EXISTS dinecore_guest_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  table_code VARCHAR(32) NOT NULL,
  order_id INT UNSIGNED NULL,
  person_slot INT NOT NULL,
  cart_id VARCHAR(64) NOT NULL,
  display_label VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dinecore_guest_sessions_order (order_id),
  INDEX idx_dinecore_guest_sessions_table (table_code),
  INDEX idx_dinecore_guest_sessions_table_status (table_code, status, last_seen_at),
  CONSTRAINT fk_dinecore_guest_sessions_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_guest_sessions_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

