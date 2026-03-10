INSERT INTO users (tenant_id, username, password, status)
VALUES
  ('dineCore', 'tako', 'tako1234', 1),
  ('dineCore', 'manager', 'manager123', 1),
  ('dineCore', 'deputy', 'deputy123', 1),
  ('dineCore', 'counter', 'counter123', 1),
  ('dineCore', 'kitchen', 'kitchen123', 1)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  status = VALUES(status);

INSERT INTO dinecore_staff_profiles (user_id, role, display_name, status)
SELECT id, 'manager', '管理者', 1
FROM users
WHERE tenant_id = 'dineCore' AND username = 'manager'
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  display_name = VALUES(display_name),
  status = VALUES(status);

INSERT INTO dinecore_staff_profiles (user_id, role, display_name, status)
SELECT id, 'deputy_manager', '副店長', 1
FROM users
WHERE tenant_id = 'dineCore' AND username = 'deputy'
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  display_name = VALUES(display_name),
  status = VALUES(status);

INSERT INTO dinecore_staff_profiles (user_id, role, display_name, status)
SELECT id, 'counter', '櫃台人員', 1
FROM users
WHERE tenant_id = 'dineCore' AND username = 'counter'
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  display_name = VALUES(display_name),
  status = VALUES(status);

INSERT INTO dinecore_staff_profiles (user_id, role, display_name, status)
SELECT id, 'kitchen', '廚房人員', 1
FROM users
WHERE tenant_id = 'dineCore' AND username = 'kitchen'
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  display_name = VALUES(display_name),
  status = VALUES(status);
