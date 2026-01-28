CREATE TABLE IF NOT EXISTS project_b_votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  allow_multiple TINYINT(1) NOT NULL DEFAULT 0,
  anonymous TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  rule_mode ENUM('all', 'time') NOT NULL DEFAULT 'all',
  rule_deadline DATETIME NULL,
  rule_total_voters INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_vote_member_id (member_id),
  KEY idx_vote_status (status),
  KEY idx_vote_rule_deadline (rule_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_b_vote_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vote_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(128) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_vote_option_vote_id (vote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_b_vote_ballots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vote_id BIGINT UNSIGNED NOT NULL,
  option_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_vote_ballot (vote_id, option_id, member_id),
  KEY idx_vote_ballot_member_id (member_id),
  KEY idx_vote_ballot_vote_id (vote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO project_b_votes
  (id, member_id, title, description, allow_multiple, anonymous, status, rule_mode, rule_deadline, rule_total_voters)
VALUES
  (1, 1, 'Project codename', 'Choose the Q1 codename.', 0, 0, 'open', 'all', NULL, 10),
  (2, 2, 'Office seating', 'Preferred seating area.', 1, 0, 'open', 'time', '2026-02-10 18:00:00', 0),
  (3, 3, 'Team outing', 'Vote for annual outing location.', 1, 0, 'closed', 'time', '2026-01-20 12:00:00', 0),
  (4, 4, 'Tooling', 'Pick a new issue tracker.', 0, 1, 'open', 'all', NULL, 12),
  (5, 5, 'Lunch policy', 'Choose lunch stipend option.', 0, 0, 'open', 'time', '2026-02-05 12:00:00', 0),
  (6, 6, 'Training topic', 'Pick a training topic for February.', 1, 1, 'open', 'all', NULL, 0),
  (7, 7, 'QA checklist', 'Select checklist version to adopt.', 0, 0, 'closed', 'time', '2026-01-15 18:00:00', 0),
  (8, 8, 'Finance tool', 'Pick expense tool for Q2.', 0, 0, 'open', 'all', NULL, 8),
  (9, 9, 'Sales playbook', 'Choose playbook template.', 0, 1, 'open', 'time', '2026-02-12 17:00:00', 0),
  (10, 10, 'Ops rotation', 'Decide weekly on-call rotation.', 1, 0, 'open', 'all', NULL, 0);

INSERT INTO project_b_vote_options
  (id, vote_id, label, sort_order)
VALUES
  (1, 1, 'Aquila', 1),
  (2, 1, 'Orion', 2),
  (3, 2, 'Window side', 1),
  (4, 2, 'Collaboration zone', 2),
  (5, 3, 'Okinawa', 1),
  (6, 3, 'Seoul', 2),
  (7, 4, 'Jira', 1),
  (8, 4, 'Linear', 2),
  (9, 5, 'Fixed stipend', 1),
  (10, 5, 'Flexible stipend', 2),
  (11, 6, 'Frontend performance', 1),
  (12, 6, 'Backend reliability', 2),
  (13, 7, 'Checklist v1', 1),
  (14, 7, 'Checklist v2', 2),
  (15, 8, 'Expensify', 1),
  (16, 8, 'Zoho Expense', 2),
  (17, 9, 'Template A', 1),
  (18, 9, 'Template B', 2),
  (19, 10, 'Rotation A', 1),
  (20, 10, 'Rotation B', 2);

INSERT INTO project_b_vote_ballots
  (id, vote_id, option_id, member_id, created_at)
VALUES
  (1, 1, 1, 2, '2026-01-22 09:00:00'),
  (2, 1, 2, 3, '2026-01-22 09:05:00'),
  (3, 2, 3, 4, '2026-01-23 10:00:00'),
  (4, 2, 4, 5, '2026-01-23 10:10:00'),
  (5, 3, 5, 6, '2026-01-18 12:00:00'),
  (6, 3, 6, 7, '2026-01-18 12:05:00'),
  (7, 4, 7, 8, '2026-01-24 09:00:00'),
  (8, 4, 8, 9, '2026-01-24 09:10:00'),
  (9, 5, 9, 10, '2026-01-25 11:00:00'),
  (10, 5, 10, 1, '2026-01-25 11:05:00'),
  (11, 6, 11, 2, '2026-01-26 09:00:00'),
  (12, 6, 12, 3, '2026-01-26 09:05:00'),
  (13, 7, 13, 4, '2026-01-14 17:00:00'),
  (14, 7, 14, 5, '2026-01-14 17:05:00'),
  (15, 8, 15, 6, '2026-01-26 10:00:00'),
  (16, 8, 16, 7, '2026-01-26 10:10:00'),
  (17, 9, 17, 8, '2026-01-26 14:00:00'),
  (18, 9, 18, 9, '2026-01-26 14:05:00'),
  (19, 10, 19, 10, '2026-01-26 16:00:00'),
  (20, 10, 20, 1, '2026-01-26 16:05:00');
