ALTER TABLE dinecore_tables
  ADD COLUMN map_id VARCHAR(64) NULL AFTER sort_order,
  ADD COLUMN map_table_id VARCHAR(64) NULL AFTER map_id,
  ADD COLUMN max_active_orders INT NOT NULL DEFAULT 1 AFTER map_table_id,
  ADD COLUMN note TEXT NULL AFTER max_active_orders;
