CREATE TABLE IF NOT EXISTS project_b_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notification_member_id (member_id),
  KEY idx_notification_is_read (is_read),
  KEY idx_notification_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO project_b_notifications
  (id, member_id, type, title, content, is_read, read_at, created_at)
VALUES
  (1, 1, 'system', 'Maintenance notice', 'System maintenance scheduled at 23:00.', 0, NULL, '2026-01-22 18:00:00'),
  (2, 2, 'task', 'Task update', 'Login panel task moved to doing.', 1, '2026-01-23 09:10:00', '2026-01-23 09:00:00'),
  (3, 3, 'vote', 'New vote', 'Please vote on Q1 project codename.', 0, NULL, '2026-01-23 10:00:00'),
  (4, 4, 'system', 'Policy update', 'Remote work policy updated.', 1, '2026-01-24 11:20:00', '2026-01-24 10:00:00'),
  (5, 5, 'task', 'Assignment', 'You were assigned to support scripts task.', 0, NULL, '2026-01-24 14:00:00'),
  (6, 6, 'system', 'HR announcement', 'New benefits enrollment opens next week.', 0, NULL, '2026-01-25 09:00:00'),
  (7, 7, 'task', 'Regression started', 'QA regression checklist started.', 1, '2026-01-25 10:15:00', '2026-01-25 09:30:00'),
  (8, 8, 'finance', 'Expense reminder', 'Please submit January receipts.', 0, NULL, '2026-01-26 09:00:00'),
  (9, 9, 'sales', 'Pipeline review', 'Weekly pipeline review at 15:00.', 1, '2026-01-26 15:05:00', '2026-01-26 14:00:00'),
  (10, 10, 'ops', 'Backup check', 'Backup verification in progress.', 0, NULL, '2026-01-26 16:00:00');
