CREATE TABLE IF NOT EXISTS dinecore_order_batches (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  batch_no INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_session_token VARCHAR(128) NULL,
  submitted_at DATETIME NULL,
  locked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_dinecore_order_batches_order_batch_no (order_id, batch_no),
  INDEX idx_dinecore_order_batches_order_status (order_id, status),
  CONSTRAINT fk_dinecore_order_batches_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

SET @sql := IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'dinecore_cart_items'
      AND COLUMN_NAME = 'batch_id'
  ),
  'SELECT 1',
  'ALTER TABLE dinecore_cart_items ADD COLUMN batch_id INT UNSIGNED NULL AFTER order_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO dinecore_order_batches (
  order_id,
  batch_no,
  status,
  source_session_token,
  submitted_at,
  locked_at,
  created_at,
  updated_at
)
SELECT
  o.id,
  1,
  CASE
    WHEN o.order_status = 'draft' THEN 'draft'
    WHEN o.order_status IN ('pending', 'submitted', 'preparing', 'ready', 'served', 'cancelled') THEN o.order_status
    ELSE 'draft'
  END,
  NULL,
  CASE
    WHEN o.order_status = 'draft' THEN NULL
    ELSE o.updated_at
  END,
  CASE
    WHEN o.order_status = 'draft' THEN NULL
    ELSE o.updated_at
  END,
  o.created_at,
  o.updated_at
FROM dinecore_orders o
LEFT JOIN dinecore_order_batches b
  ON b.order_id = o.id
 AND b.batch_no = 1
WHERE b.id IS NULL;

UPDATE dinecore_cart_items ci
INNER JOIN dinecore_order_batches b
  ON b.order_id = ci.order_id
 AND b.batch_no = 1
SET ci.batch_id = b.id
WHERE ci.batch_id IS NULL;

SET @sql := IF (
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'dinecore_cart_items'
      AND INDEX_NAME = 'idx_dinecore_cart_items_batch_cart'
  ),
  'SELECT 1',
  'ALTER TABLE dinecore_cart_items ADD INDEX idx_dinecore_cart_items_batch_cart (batch_id, cart_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF (
  EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'dinecore_cart_items'
      AND CONSTRAINT_NAME = 'fk_dinecore_cart_items_batch'
  ),
  'SELECT 1',
  'ALTER TABLE dinecore_cart_items ADD CONSTRAINT fk_dinecore_cart_items_batch FOREIGN KEY (batch_id) REFERENCES dinecore_order_batches(id) ON DELETE CASCADE ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF (
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'dinecore_cart_items'
      AND COLUMN_NAME = 'batch_id'
      AND IS_NULLABLE = 'NO'
  ),
  'SELECT 1',
  'ALTER TABLE dinecore_cart_items MODIFY COLUMN batch_id INT UNSIGNED NOT NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
