-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： localhost
-- 產生時間： 2026-02-12 08:12:18
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `moducore_platform`
--
CREATE DATABASE IF NOT EXISTS `moducore_platform` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `moducore_platform`;

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_employees`
--

CREATE TABLE `project_b_employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `department` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `role` varchar(32) NOT NULL DEFAULT 'staff',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_employees`
--

INSERT INTO `project_b_employees` (`id`, `member_id`, `user_id`, `name`, `title`, `department`, `email`, `phone`, `status`, `role`, `created_at`, `updated_at`) VALUES
(1, 1, 11, 'Alex Chen', 'Engineer', 'R&D', 'alex.chen@example.com', '0900-000-001', 'active', 'super_admin', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(2, 2, 12, 'Bella Lin', 'Designer', 'Design', 'bella.lin@example.com', '0900-000-002', 'active', 'manager', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(3, 3, 13, 'Chris Wang', 'Product Manager', 'Product', 'chris.wang@example.com', '0900-000-003', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(4, 4, 14, 'Diana Lee', 'Marketing', 'Marketing', 'diana.lee@example.com', '0900-000-004', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(5, 5, 15, 'Evan Wu', 'Customer Lead', 'Support', 'evan.wu@example.com', '0900-000-005', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(6, 6, 16, 'Fiona Kao', 'HR', 'HR', 'fiona.kao@example.com', '0900-000-006', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(7, 7, 17, 'Gary Ho', 'QA', 'QA', 'gary.ho@example.com', '0900-000-007', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(8, 8, 18, 'Helen Tsai', 'Finance', 'Finance', 'helen.tsai@example.com', '0900-000-008', 'inactive', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(9, 9, 19, 'Ian Huang', 'Sales', 'Sales', 'ian.huang@example.com', '0900-000-009', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(10, 10, 20, 'Jane Lu', 'Ops', 'Operations', 'jane.lu@example.com', '0900-000-010', 'active', 'staff', '2026-02-02 23:06:27', '2026-02-02 23:06:27'),
(11, 11, NULL, '小狗貓', 'rap', '推廣部', '111@gmail.com', '02333555', 'active', 'staff', '2026-02-04 19:26:42', '2026-02-04 19:26:42'),
(12, 12, NULL, '兔利魚', '歌手', '推廣部', 'leu@gmail.com', '0911123123', 'active', 'staff', '2026-02-04 19:29:24', '2026-02-04 19:29:24');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_notifications`
--

CREATE TABLE `project_b_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_notifications`
--

INSERT INTO `project_b_notifications` (`id`, `member_id`, `type`, `title`, `content`, `is_read`, `read_at`, `created_at`) VALUES
(1, 1, 'system', 'Maintenance notice', 'System maintenance scheduled at 23:00.', 1, '2026-02-04 19:25:23', '2026-01-22 18:00:00'),
(2, 2, 'task', 'Task update', 'Login panel task moved to doing.', 1, '2026-01-23 09:10:00', '2026-01-23 09:00:00'),
(3, 3, 'vote', 'New vote', 'Please vote on Q1 project codename.', 0, NULL, '2026-01-23 10:00:00'),
(4, 4, 'system', 'Policy update', 'Remote work policy updated.', 1, '2026-01-24 11:20:00', '2026-01-24 10:00:00'),
(5, 5, 'task', 'Assignment', 'You were assigned to support scripts task.', 0, NULL, '2026-01-24 14:00:00'),
(6, 6, 'system', 'HR announcement', 'New benefits enrollment opens next week.', 0, NULL, '2026-01-25 09:00:00'),
(7, 7, 'task', 'Regression started', 'QA regression checklist started.', 1, '2026-01-25 10:15:00', '2026-01-25 09:30:00'),
(8, 8, 'finance', 'Expense reminder', 'Please submit January receipts.', 0, NULL, '2026-01-26 09:00:00'),
(9, 9, 'sales', 'Pipeline review', 'Weekly pipeline review at 15:00.', 1, '2026-01-26 15:05:00', '2026-01-26 14:00:00'),
(10, 10, 'ops', 'Backup check', 'Backup verification in progress.', 0, NULL, '2026-01-26 16:00:00'),
(11, 1, 'vote', '新增投票', '投票「測試新投票派發」已建立', 0, NULL, '2026-02-04 19:37:45');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_tasks`
--

CREATE TABLE `project_b_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `publisher_member_id` bigint(20) UNSIGNED NOT NULL,
  `assignee_member_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `status` enum('todo','doing','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_tasks`
--

INSERT INTO `project_b_tasks` (`id`, `member_id`, `publisher_member_id`, `assignee_member_id`, `title`, `description`, `status`, `priority`, `due_date`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 'Set up onboarding', 'Prepare onboarding checklist and accounts.', 'todo', 'high', '2026-02-10', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(2, 2, 2, 3, 'Design login panel', 'Draft UI variants for login panel.', 'doing', 'medium', '2026-02-05', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(3, 3, 3, 4, 'Prepare product brief', 'Summarize Q1 scope and milestones.', 'todo', 'medium', '2026-02-12', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(4, 4, 4, 5, 'Marketing campaign', 'Plan February campaign assets.', 'todo', 'low', '2026-02-20', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(5, 5, 5, 6, 'Support scripts', 'Update support response templates.', 'doing', 'medium', '2026-02-08', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(6, 6, 6, 7, 'HR policy update', 'Revise remote work policy draft.', 'done', 'low', '2026-01-31', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(7, 7, 7, 8, 'QA regression', 'Run regression checklist for release.', 'doing', 'high', '2026-02-03', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(8, 8, 8, 9, 'Finance report', 'Compile monthly expense report.', 'todo', 'medium', '2026-02-15', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(9, 9, 9, 10, 'Sales pipeline', 'Clean up pipeline and follow-ups.', 'todo', 'medium', '2026-02-18', '2026-02-02 23:06:46', '2026-02-02 23:06:46'),
(10, 10, 10, 1, 'Ops checklist', 'Verify infra and backups.', 'doing', 'high', '2026-02-06', '2026-02-02 23:06:46', '2026-02-02 23:06:46');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_task_events`
--

CREATE TABLE `project_b_task_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_type` enum('system','note') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_task_events`
--

INSERT INTO `project_b_task_events` (`id`, `task_id`, `member_id`, `event_type`, `content`, `created_at`) VALUES
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
(12, 10, 10, 'note', 'Backup verification in progress.', '2026-01-26 16:10:00'),
(13, 10, NULL, 'note', '測看看', '2026-02-03 00:00:14'),
(14, 10, 1, 'note', '可以在側看看', '2026-02-04 19:38:04');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_task_members`
--

CREATE TABLE `project_b_task_members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('participant','watcher') NOT NULL DEFAULT 'participant',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_task_members`
--

INSERT INTO `project_b_task_members` (`id`, `task_id`, `member_id`, `role`, `created_at`) VALUES
(1, 1, 1, 'participant', '2026-02-02 23:06:46'),
(2, 1, 2, 'watcher', '2026-02-02 23:06:46'),
(3, 2, 2, 'participant', '2026-02-02 23:06:46'),
(4, 2, 3, 'watcher', '2026-02-02 23:06:46'),
(5, 3, 3, 'participant', '2026-02-02 23:06:46'),
(6, 4, 4, 'participant', '2026-02-02 23:06:46'),
(7, 5, 5, 'participant', '2026-02-02 23:06:46'),
(8, 6, 6, 'participant', '2026-02-02 23:06:46'),
(9, 7, 7, 'participant', '2026-02-02 23:06:46'),
(10, 8, 8, 'participant', '2026-02-02 23:06:46'),
(11, 9, 9, 'participant', '2026-02-02 23:06:46'),
(12, 10, 10, 'participant', '2026-02-02 23:06:46'),
(13, 7, 1, 'watcher', '2026-02-02 23:06:46'),
(14, 5, 2, 'watcher', '2026-02-02 23:06:46'),
(15, 3, 4, 'watcher', '2026-02-02 23:06:46');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_votes`
--

CREATE TABLE `project_b_votes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `allow_multiple` tinyint(1) NOT NULL DEFAULT 0,
  `anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `rule_mode` enum('all','time') NOT NULL DEFAULT 'all',
  `rule_deadline` datetime DEFAULT NULL,
  `rule_total_voters` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_votes`
--

INSERT INTO `project_b_votes` (`id`, `member_id`, `title`, `description`, `allow_multiple`, `anonymous`, `status`, `rule_mode`, `rule_deadline`, `rule_total_voters`, `created_at`, `updated_at`) VALUES
(1, 1, 'Project codename', 'Choose the Q1 codename.', 0, 0, 'open', 'all', NULL, 10, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(2, 2, 'Office seating', 'Preferred seating area.', 1, 0, 'open', 'time', '2026-02-10 18:00:00', 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(3, 3, 'Team outing', 'Vote for annual outing location.', 1, 0, 'closed', 'time', '2026-01-20 12:00:00', 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(4, 4, 'Tooling', 'Pick a new issue tracker.', 0, 1, 'open', 'all', NULL, 12, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(5, 5, 'Lunch policy', 'Choose lunch stipend option.', 0, 0, 'open', 'time', '2026-02-05 12:00:00', 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(6, 6, 'Training topic', 'Pick a training topic for February.', 1, 1, 'open', 'all', NULL, 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(7, 7, 'QA checklist', 'Select checklist version to adopt.', 0, 0, 'closed', 'time', '2026-01-15 18:00:00', 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(8, 8, 'Finance tool', 'Pick expense tool for Q2.', 0, 0, 'open', 'all', NULL, 8, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(9, 9, 'Sales playbook', 'Choose playbook template.', 0, 1, 'open', 'time', '2026-02-12 17:00:00', 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(10, 10, 'Ops rotation', 'Decide weekly on-call rotation.', 1, 0, 'open', 'all', NULL, 0, '2026-02-02 23:06:55', '2026-02-02 23:06:55'),
(11, 1, '測試測試測試測試', '測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試', 0, 0, 'open', 'all', NULL, 0, '2026-02-04 19:31:06', '2026-02-04 19:31:06'),
(12, 1, '測試新投票派發', '測試新投票派發測試新投票派發測試新投票派發測試新投票派發測試新投票派發', 0, 0, 'open', 'all', NULL, 0, '2026-02-04 19:37:45', '2026-02-04 19:37:45');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_vote_ballots`
--

CREATE TABLE `project_b_vote_ballots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vote_id` bigint(20) UNSIGNED NOT NULL,
  `option_id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_vote_ballots`
--

INSERT INTO `project_b_vote_ballots` (`id`, `vote_id`, `option_id`, `member_id`, `created_at`) VALUES
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
(20, 10, 20, 1, '2026-01-26 16:05:00'),
(21, 10, 20, 11, '2026-02-03 00:00:45'),
(23, 9, 17, 11, '2026-02-03 00:01:00'),
(26, 8, 16, 11, '2026-02-03 00:01:21'),
(29, 4, 8, 11, '2026-02-03 00:01:35');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_vote_options`
--

CREATE TABLE `project_b_vote_options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vote_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(128) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_b_vote_options`
--

INSERT INTO `project_b_vote_options` (`id`, `vote_id`, `label`, `sort_order`, `created_at`) VALUES
(1, 1, 'Aquila', 1, '2026-02-02 23:06:55'),
(2, 1, 'Orion', 2, '2026-02-02 23:06:55'),
(3, 2, 'Window side', 1, '2026-02-02 23:06:55'),
(4, 2, 'Collaboration zone', 2, '2026-02-02 23:06:55'),
(5, 3, 'Okinawa', 1, '2026-02-02 23:06:55'),
(6, 3, 'Seoul', 2, '2026-02-02 23:06:55'),
(7, 4, 'Jira', 1, '2026-02-02 23:06:55'),
(8, 4, 'Linear', 2, '2026-02-02 23:06:55'),
(9, 5, 'Fixed stipend', 1, '2026-02-02 23:06:55'),
(10, 5, 'Flexible stipend', 2, '2026-02-02 23:06:55'),
(11, 6, 'Frontend performance', 1, '2026-02-02 23:06:55'),
(12, 6, 'Backend reliability', 2, '2026-02-02 23:06:55'),
(13, 7, 'Checklist v1', 1, '2026-02-02 23:06:55'),
(14, 7, 'Checklist v2', 2, '2026-02-02 23:06:55'),
(15, 8, 'Expensify', 1, '2026-02-02 23:06:55'),
(16, 8, 'Zoho Expense', 2, '2026-02-02 23:06:55'),
(17, 9, 'Template A', 1, '2026-02-02 23:06:55'),
(18, 9, 'Template B', 2, '2026-02-02 23:06:55'),
(19, 10, 'Rotation A', 1, '2026-02-02 23:06:55'),
(20, 10, 'Rotation B', 2, '2026-02-02 23:06:55'),
(21, 11, '選項 1', 1, '2026-02-04 19:31:06'),
(22, 11, '選項 2', 2, '2026-02-04 19:31:06'),
(23, 12, '選項 1', 1, '2026-02-04 19:37:45'),
(24, 12, '選項 2', 2, '2026-02-04 19:37:45');

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `tenant_id` varchar(50) NOT NULL COMMENT '世界 / 專案識別，用於 world rebuild',
  `username` varchar(50) NOT NULL COMMENT '登入帳號（tenant scope）',
  `password` varchar(255) NOT NULL COMMENT '密碼（可暫時明文或簡單 hash）',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1=active, 0=disabled',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `username`, `password`, `status`, `created_at`) VALUES
(1, 'project_a', 'admin', '1234', 1, '2026-01-28 10:18:02'),
(2, 'project_a', 'tester', '1234', 1, '2026-01-28 10:18:02'),
(3, 'project_a', 'a_owner', '1234', 1, '2026-01-28 10:18:02'),
(4, 'project_a', 'a_manager', '1234', 1, '2026-01-28 10:18:02'),
(5, 'project_a', 'a_staff', '1234', 1, '2026-01-28 10:18:02'),
(6, 'project_a', 'a_support', '1234', 1, '2026-01-28 10:18:02'),
(7, 'project_a', 'a_viewer', '1234', 1, '2026-01-28 10:18:02'),
(8, 'project_a', 'a_disabled', '1234', 0, '2026-01-28 10:18:02'),
(9, 'project_a', 'a_guest', '1234', 0, '2026-01-28 10:18:02'),
(10, 'project_a', 'a_qa', '1234', 1, '2026-01-28 10:18:02'),
(11, 'project_b', 'admin', '5678', 1, '2026-01-28 10:18:02'),
(12, 'project_b', 'tester', '5678', 0, '2026-01-28 10:18:02'),
(13, 'project_b', 'b_owner', '5678', 1, '2026-01-28 10:18:02'),
(14, 'project_b', 'b_manager', '5678', 1, '2026-01-28 10:18:02'),
(15, 'project_b', 'b_staff', '5678', 1, '2026-01-28 10:18:02'),
(16, 'project_b', 'b_support', '5678', 1, '2026-01-28 10:18:02'),
(17, 'project_b', 'b_viewer', '5678', 1, '2026-01-28 10:18:02'),
(18, 'project_b', 'b_disabled', '5678', 0, '2026-01-28 10:18:02'),
(19, 'project_b', 'b_guest', '5678', 1, '2026-01-28 10:18:02'),
(20, 'project_b', 'b_ops', '5678', 1, '2026-01-28 10:18:02');

-- --------------------------------------------------------

--
-- 資料表結構 `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(128) NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- 傾印資料表的資料 `user_tokens`
--

INSERT INTO `user_tokens` (`id`, `user_id`, `token`, `revoked_at`, `created_at`) VALUES
(1, 11, 'ed3bc8767ef41446e0425535df8165650187715386be340b701d92a23597cd84', NULL, '2026-02-02 23:21:42'),
(2, 11, '83ef909759a244915da1484a93dfc40deaecd052e180c33961e84125df8b786c', NULL, '2026-02-02 23:40:09'),
(3, 11, '08f07449ace225c25341dc7fdb523042e3efeb0e3f1469b595c6ed7b999d5a5e', NULL, '2026-02-02 23:59:52'),
(4, 11, '070d8a2778458346cf2b336a47c976e43a8e135993d5e89d9cd300b0e59c9c0c', NULL, '2026-02-03 00:03:27'),
(5, 11, '2edd3d60ad4efba526517a7897f71c53daf3042ab628f771aadc2f93731b1435', NULL, '2026-02-03 00:14:48'),
(6, 11, '83bf2643d7b2441bcf65d6aa66ea14f3e051ec784b53c3695441aae1eaca6fd4', NULL, '2026-02-03 18:07:22'),
(7, 11, '5dfde84d5ffe73cda71677c8789bf9e2c4cc29b179b2d97a34257b278dc0aea7', NULL, '2026-02-04 17:54:49'),
(8, 11, 'c88ccc03ae6ef7ba2e7f054a6100fc20a09a6bd125ed88f5f11d9f992a846a92', NULL, '2026-02-04 19:30:34'),
(9, 11, '0750d3ae2adad1ed8d52ffb9c96ac3073f73c8714226dfa6b990af405745e2d9', NULL, '2026-02-04 22:08:18'),
(10, 11, 'ad3b197b382e681b850f4165a30f7db0422b5d65c601980abfd96d6ba3992bcb', NULL, '2026-02-04 22:32:03'),
(11, 11, '7e940426f9153d736dc5c95abc79acd38f830e9ba722f7d94eaf57b144768d87', '2026-02-10 08:44:04', '2026-02-09 10:19:35'),
(12, 11, '63d80d85e8df189448e84c10f86b8b1a266ae6aa504da191d324c83a15f9828c', NULL, '2026-02-10 08:44:06'),
(13, 11, 'e381d271cbb36c1dfbf8e1c2e44ba1335380060d45dc280c96bf6dfe95b49484', NULL, '2026-02-11 13:43:41');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `project_b_employees`
--
ALTER TABLE `project_b_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_employee_member_email` (`member_id`,`email`),
  ADD KEY `idx_employee_member_id` (`member_id`),
  ADD KEY `idx_employee_user_id` (`user_id`),
  ADD KEY `idx_employee_status` (`status`);

--
-- 資料表索引 `project_b_notifications`
--
ALTER TABLE `project_b_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_member_id` (`member_id`),
  ADD KEY `idx_notification_is_read` (`is_read`),
  ADD KEY `idx_notification_created_at` (`created_at`);

--
-- 資料表索引 `project_b_tasks`
--
ALTER TABLE `project_b_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_member_id` (`member_id`),
  ADD KEY `idx_task_publisher_member_id` (`publisher_member_id`),
  ADD KEY `idx_task_assignee_member_id` (`assignee_member_id`),
  ADD KEY `idx_task_status` (`status`),
  ADD KEY `idx_task_due_date` (`due_date`);

--
-- 資料表索引 `project_b_task_events`
--
ALTER TABLE `project_b_task_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_task_event_task_id` (`task_id`),
  ADD KEY `idx_task_event_member_id` (`member_id`);

--
-- 資料表索引 `project_b_task_members`
--
ALTER TABLE `project_b_task_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_task_member` (`task_id`,`member_id`),
  ADD KEY `idx_task_member_task_id` (`task_id`),
  ADD KEY `idx_task_member_member_id` (`member_id`);

--
-- 資料表索引 `project_b_votes`
--
ALTER TABLE `project_b_votes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vote_member_id` (`member_id`),
  ADD KEY `idx_vote_status` (`status`),
  ADD KEY `idx_vote_rule_deadline` (`rule_deadline`);

--
-- 資料表索引 `project_b_vote_ballots`
--
ALTER TABLE `project_b_vote_ballots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_vote_ballot` (`vote_id`,`option_id`,`member_id`),
  ADD KEY `idx_vote_ballot_member_id` (`member_id`),
  ADD KEY `idx_vote_ballot_vote_id` (`vote_id`);

--
-- 資料表索引 `project_b_vote_options`
--
ALTER TABLE `project_b_vote_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vote_option_vote_id` (`vote_id`);

--
-- 資料表索引 `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_revoked_at` (`revoked_at`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_employees`
--
ALTER TABLE `project_b_employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_notifications`
--
ALTER TABLE `project_b_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_tasks`
--
ALTER TABLE `project_b_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_task_events`
--
ALTER TABLE `project_b_task_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_task_members`
--
ALTER TABLE `project_b_task_members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_votes`
--
ALTER TABLE `project_b_votes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_vote_ballots`
--
ALTER TABLE `project_b_vote_ballots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_vote_options`
--
ALTER TABLE `project_b_vote_options`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
