CREATE TABLE IF NOT EXISTS project_b_employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(64) NOT NULL,
  title VARCHAR(64) NOT NULL,
  department VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  role VARCHAR(32) NOT NULL DEFAULT 'staff',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_employee_member_email (member_id, email),
  KEY idx_employee_member_id (member_id),
  KEY idx_employee_user_id (user_id),
  KEY idx_employee_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO project_b_employees
  (id, member_id, user_id, name, title, department, email, phone, status, role)
VALUES
  (1, 1, 11, 'Alex Chen', 'Engineer', 'R&D', 'alex.chen@example.com', '0900-000-001', 'active', 'super_admin'),
  (2, 2, 12, 'Bella Lin', 'Designer', 'Design', 'bella.lin@example.com', '0900-000-002', 'active', 'manager'),
  (3, 3, 13, 'Chris Wang', 'Product Manager', 'Product', 'chris.wang@example.com', '0900-000-003', 'active', 'staff'),
  (4, 4, 14, 'Diana Lee', 'Marketing', 'Marketing', 'diana.lee@example.com', '0900-000-004', 'active', 'staff'),
  (5, 5, 15, 'Evan Wu', 'Customer Lead', 'Support', 'evan.wu@example.com', '0900-000-005', 'active', 'staff'),
  (6, 6, 16, 'Fiona Kao', 'HR', 'HR', 'fiona.kao@example.com', '0900-000-006', 'active', 'staff'),
  (7, 7, 17, 'Gary Ho', 'QA', 'QA', 'gary.ho@example.com', '0900-000-007', 'active', 'staff'),
  (8, 8, 18, 'Helen Tsai', 'Finance', 'Finance', 'helen.tsai@example.com', '0900-000-008', 'inactive', 'staff'),
  (9, 9, 19, 'Ian Huang', 'Sales', 'Sales', 'ian.huang@example.com', '0900-000-009', 'active', 'staff'),
  (10, 10, 20, 'Jane Lu', 'Ops', 'Operations', 'jane.lu@example.com', '0900-000-010', 'active', 'staff');
