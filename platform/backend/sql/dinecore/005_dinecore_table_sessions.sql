CREATE TABLE IF NOT EXISTS dinecore_table_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  table_code VARCHAR(32) NOT NULL,
  order_id INT UNSIGNED NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'closed',
  started_at DATETIME NULL,
  closed_at DATETIME NULL,
  guest_state_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_dinecore_table_sessions_table_code (table_code),
  INDEX idx_dinecore_table_sessions_order_id (order_id),
  INDEX idx_dinecore_table_sessions_status (status),
  INDEX idx_dinecore_table_sessions_table_status (table_code, status, id),
  CONSTRAINT fk_dinecore_table_sessions_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_table_sessions_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

INSERT INTO dinecore_table_sessions (
  table_code,
  order_id,
  status,
  started_at,
  closed_at,
  guest_state_json,
  created_at,
  updated_at
)
SELECT
  t.code AS table_code,
  NULL AS order_id,
  'closed' AS status,
  NULL AS started_at,
  NULL AS closed_at,
  '[]' AS guest_state_json,
  NOW() AS created_at,
  NOW() AS updated_at
FROM dinecore_tables t
LEFT JOIN dinecore_table_sessions ts
  ON ts.table_code = t.code
WHERE ts.id IS NULL;

UPDATE dinecore_table_sessions ts
INNER JOIN (
  SELECT table_code, MAX(id) AS latest_open_order_id
  FROM dinecore_orders
  WHERE payment_status <> 'paid'
    AND order_status <> 'cancelled'
  GROUP BY table_code
) latest
  ON latest.table_code = ts.table_code
SET
  ts.order_id = latest.latest_open_order_id,
  ts.status = 'active',
  ts.started_at = NOW(),
  ts.closed_at = NULL,
  ts.guest_state_json = COALESCE(ts.guest_state_json, '[]'),
  ts.updated_at = NOW();
