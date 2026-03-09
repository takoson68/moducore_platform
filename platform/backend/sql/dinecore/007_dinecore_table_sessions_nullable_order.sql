ALTER TABLE dinecore_table_sessions
  DROP FOREIGN KEY fk_dinecore_table_sessions_order;

ALTER TABLE dinecore_table_sessions
  MODIFY order_id INT UNSIGNED NULL;

ALTER TABLE dinecore_table_sessions
  ADD CONSTRAINT fk_dinecore_table_sessions_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

