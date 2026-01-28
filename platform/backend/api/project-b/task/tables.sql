CREATE TABLE IF NOT EXISTS project_b_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT UNSIGNED NOT NULL,
  publisher_member_id BIGINT UNSIGNED NOT NULL,
  assignee_member_id BIGINT UNSIGNED NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('todo', 'doing', 'done') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_task_member_id (member_id),
  KEY idx_task_publisher_member_id (publisher_member_id),
  KEY idx_task_assignee_member_id (assignee_member_id),
  KEY idx_task_status (status),
  KEY idx_task_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_b_task_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  role ENUM('participant', 'watcher') NOT NULL DEFAULT 'participant',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_task_member (task_id, member_id),
  KEY idx_task_member_task_id (task_id),
  KEY idx_task_member_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_b_task_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NULL,
  event_type ENUM('system', 'note') NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_task_event_task_id (task_id),
  KEY idx_task_event_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO project_b_tasks
  (id, member_id, publisher_member_id, assignee_member_id, title, description, status, priority, due_date)
VALUES
  (1, 1, 1, 2, 'Set up onboarding', 'Prepare onboarding checklist and accounts.', 'todo', 'high', '2026-02-10'),
  (2, 2, 2, 3, 'Design login panel', 'Draft UI variants for login panel.', 'doing', 'medium', '2026-02-05'),
  (3, 3, 3, 4, 'Prepare product brief', 'Summarize Q1 scope and milestones.', 'todo', 'medium', '2026-02-12'),
  (4, 4, 4, 5, 'Marketing campaign', 'Plan February campaign assets.', 'todo', 'low', '2026-02-20'),
  (5, 5, 5, 6, 'Support scripts', 'Update support response templates.', 'doing', 'medium', '2026-02-08'),
  (6, 6, 6, 7, 'HR policy update', 'Revise remote work policy draft.', 'done', 'low', '2026-01-31'),
  (7, 7, 7, 8, 'QA regression', 'Run regression checklist for release.', 'doing', 'high', '2026-02-03'),
  (8, 8, 8, 9, 'Finance report', 'Compile monthly expense report.', 'todo', 'medium', '2026-02-15'),
  (9, 9, 9, 10, 'Sales pipeline', 'Clean up pipeline and follow-ups.', 'todo', 'medium', '2026-02-18'),
  (10, 10, 10, 1, 'Ops checklist', 'Verify infra and backups.', 'doing', 'high', '2026-02-06');

INSERT INTO project_b_task_members
  (id, task_id, member_id, role)
VALUES
  (1, 1, 1, 'participant'),
  (2, 1, 2, 'watcher'),
  (3, 2, 2, 'participant'),
  (4, 2, 3, 'watcher'),
  (5, 3, 3, 'participant'),
  (6, 4, 4, 'participant'),
  (7, 5, 5, 'participant'),
  (8, 6, 6, 'participant'),
  (9, 7, 7, 'participant'),
  (10, 8, 8, 'participant'),
  (11, 9, 9, 'participant'),
  (12, 10, 10, 'participant'),
  (13, 7, 1, 'watcher'),
  (14, 5, 2, 'watcher'),
  (15, 3, 4, 'watcher');

INSERT INTO project_b_task_events
  (id, task_id, member_id, event_type, content, created_at)
VALUES
  (1, 1, NULL, 'system', 'Task created and assigned.', '2026-01-20 09:00:00'),
  (2, 1, 2, 'note', 'Checklist drafted, waiting for review.', '2026-01-21 10:30:00'),
  (3, 2, NULL, 'system', 'Status changed to doing.', '2026-01-22 09:15:00'),
  (4, 2, 2, 'note', 'Uploaded first mockups.', '2026-01-22 16:40:00'),
  (5, 3, NULL, 'system', 'Task created and assigned.', '2026-01-23 11:05:00'),
  (6, 4, 4, 'note', 'Draft outline shared with team.', '2026-01-23 17:20:00'),
  (7, 5, NULL, 'system', 'Status changed to doing.', '2026-01-24 09:10:00'),
  (8, 6, 6, 'note', 'Policy updated and sent for approval.', '2026-01-24 15:00:00'),
  (9, 7, NULL, 'system', 'Regression started.', '2026-01-25 09:00:00'),
  (10, 8, 8, 'note', 'Collected receipts from team.', '2026-01-25 13:45:00'),
  (11, 9, NULL, 'system', 'Task created and assigned.', '2026-01-26 09:00:00'),
  (12, 10, 10, 'note', 'Backup verification in progress.', '2026-01-26 16:10:00');
