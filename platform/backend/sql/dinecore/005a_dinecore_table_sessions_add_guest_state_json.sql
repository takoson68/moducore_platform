ALTER TABLE dinecore_table_sessions
  ADD COLUMN guest_state_json LONGTEXT NULL AFTER closed_at;

UPDATE dinecore_table_sessions
SET guest_state_json = '[]'
WHERE guest_state_json IS NULL OR TRIM(guest_state_json) = '';
