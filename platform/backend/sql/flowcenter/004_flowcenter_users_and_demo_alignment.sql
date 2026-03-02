INSERT INTO users (tenant_id, username, password, status)
VALUES
  ('flowCenter', 'fc_manager_a', 'flow1234', 1),
  ('flowCenter', 'fc_employee_a', 'flow1234', 1),
  ('flowCenter', 'fc_employee_a2', 'flow1234', 1),
  ('flowCenter', 'fc_employee_a3', 'flow1234', 1),
  ('flowCenter', 'fc_employee_a4', 'flow1234', 1),
  ('flowCenter', 'fc_manager_b', 'flow1234', 1),
  ('flowCenter', 'fc_employee_b', 'flow1234', 1),
  ('flowCenter', 'fc_employee_b2', 'flow1234', 1),
  ('flowCenter', 'fc_employee_b3', 'flow1234', 1),
  ('flowCenter', 'fc_employee_b4', 'flow1234', 1)
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  status = VALUES(status);

SET @fc_manager_a  = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_manager_a' LIMIT 1);
SET @fc_employee_a = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_a' LIMIT 1);
SET @fc_employee_a2 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_a2' LIMIT 1);
SET @fc_employee_a3 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_a3' LIMIT 1);
SET @fc_employee_a4 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_a4' LIMIT 1);
SET @fc_manager_b  = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_manager_b' LIMIT 1);
SET @fc_employee_b = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_b' LIMIT 1);
SET @fc_employee_b2 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_b2' LIMIT 1);
SET @fc_employee_b3 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_b3' LIMIT 1);
SET @fc_employee_b4 = (SELECT id FROM users WHERE tenant_id = 'flowCenter' AND username = 'fc_employee_b4' LIMIT 1);

DELETE FROM flowcenter_approvals;
DELETE FROM flowcenter_tasks;
DELETE FROM flowcenter_announcements;
DELETE FROM flowcenter_purchase_requests;
DELETE FROM flowcenter_leave_requests;
DELETE FROM flowcenter_user_profiles;

ALTER TABLE flowcenter_leave_requests AUTO_INCREMENT = 1;
ALTER TABLE flowcenter_purchase_requests AUTO_INCREMENT = 1;
ALTER TABLE flowcenter_announcements AUTO_INCREMENT = 1;
ALTER TABLE flowcenter_tasks AUTO_INCREMENT = 1;
ALTER TABLE flowcenter_approvals AUTO_INCREMENT = 1;
ALTER TABLE flowcenter_user_profiles AUTO_INCREMENT = 1;

INSERT INTO flowcenter_user_profiles (user_id, company_id, role, display_name, status)
VALUES
  (@fc_manager_a, 'company-a', 'manager', '流程管理員 A', 1),
  (@fc_employee_a, 'company-a', 'employee', '一般員工 A1', 1),
  (@fc_employee_a2, 'company-a', 'employee', '一般員工 A2', 1),
  (@fc_employee_a3, 'company-a', 'employee', '一般員工 A3', 1),
  (@fc_employee_a4, 'company-a', 'employee', '一般員工 A4', 1),
  (@fc_manager_b, 'company-b', 'manager', '流程管理員 B', 1),
  (@fc_employee_b, 'company-b', 'employee', '一般員工 B1', 1),
  (@fc_employee_b2, 'company-b', 'employee', '一般員工 B2', 1),
  (@fc_employee_b3, 'company-b', 'employee', '一般員工 B3', 1),
  (@fc_employee_b4, 'company-b', 'employee', '一般員工 B4', 1);

INSERT INTO flowcenter_leave_requests
  (id, company_id, user_id, leave_type, start_date, end_date, days, status, reason, delegate_name, created_at, updated_at)
VALUES
  (1, 'company-a', @fc_employee_a, 'annual', '2026-03-10', '2026-03-12', 3.00, 'submitted', '家庭旅遊', '一般員工 A2', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
  (2, 'company-a', @fc_employee_a2, 'sick', '2026-02-25', '2026-02-25', 1.00, 'approved', '感冒就醫', '一般員工 A1', '2026-02-24 08:30:00', '2026-02-24 11:00:00'),
  (3, 'company-a', @fc_employee_a3, 'personal', '2026-03-15', '2026-03-15', 1.00, 'draft', '處理私人事務', '一般員工 A4', '2026-03-01 14:20:00', '2026-03-01 14:20:00'),
  (4, 'company-b', @fc_employee_b, 'annual', '2026-03-08', '2026-03-09', 2.00, 'submitted', '返鄉安排', '一般員工 B2', '2026-03-01 10:40:00', '2026-03-01 10:40:00'),
  (5, 'company-b', @fc_employee_b2, 'personal', '2026-02-28', '2026-02-28', 1.00, 'rejected', '銀行辦理文件', '一般員工 B1', '2026-02-27 16:00:00', '2026-02-27 18:10:00');

INSERT INTO flowcenter_purchase_requests
  (id, company_id, user_id, item_name, amount, purpose, vendor_name, status, created_at, updated_at)
VALUES
  (1, 'company-a', @fc_employee_a, '27 吋顯示器', 9800.00, '提升多工處理效率', 'ViewBest', 'submitted', '2026-03-01 13:00:00', '2026-03-01 13:00:00'),
  (2, 'company-a', @fc_employee_a2, '會議室白板', 3200.00, '產品討論會議使用', 'Office Pro', 'approved', '2026-02-23 09:30:00', '2026-02-23 15:40:00'),
  (3, 'company-a', @fc_employee_a4, '人體工學鍵盤', 2600.00, '改善長時間輸入體驗', 'KeyWorks', 'draft', '2026-03-01 17:10:00', '2026-03-01 17:10:00');

INSERT INTO flowcenter_announcements
  (id, company_id, author_user_id, title, content, published_at, created_at, updated_at)
VALUES
  (1, 'company-a', @fc_manager_a, '三月部門週會', '請各部門於週三上午 10:00 準時參與月會。', '2026-03-01 08:00:00', '2026-03-01 07:50:00', '2026-03-01 08:00:00'),
  (2, 'company-a', @fc_manager_a, 'Q2 訓練課程草案', '培訓課表草案已完成，請主管先行檢視。', NULL, '2026-03-01 11:20:00', '2026-03-01 11:20:00'),
  (3, 'company-b', @fc_manager_b, '公司 B 倉儲盤點', '本週五下午進行盤點，出貨流程將提前截止。', '2026-03-01 09:10:00', '2026-03-01 09:00:00', '2026-03-01 09:10:00');

INSERT INTO flowcenter_tasks
  (id, company_id, creator_user_id, assignee_user_id, title, description, priority, status, due_date, created_at, updated_at)
VALUES
  (1, 'company-a', @fc_manager_a, @fc_employee_a, '整理請假制度 FAQ', '補齊新人常見問題與流程說明。', 'high', 'doing', '2026-03-06', '2026-03-01 08:40:00', '2026-03-01 09:30:00'),
  (2, 'company-a', @fc_employee_a, @fc_employee_a2, '採購規格比價', '針對顯示器需求整理三家供應商報價。', 'medium', 'todo', '2026-03-05', '2026-03-01 13:30:00', '2026-03-01 13:30:00'),
  (3, 'company-a', @fc_employee_a2, NULL, '整理月報數據', '彙整本月專案 KPI 與風險摘要。', 'low', 'done', '2026-02-28', '2026-02-26 16:00:00', '2026-02-28 18:20:00'),
  (4, 'company-b', @fc_manager_b, @fc_employee_b, '更新倉儲值班表', '請依新排班規則更新共享文件。', 'medium', 'todo', '2026-03-04', '2026-03-01 10:00:00', '2026-03-01 10:00:00');

INSERT INTO flowcenter_approvals
  (id, company_id, approver_user_id, source_type, source_id, decision, comment, created_at, updated_at)
VALUES
  (1, 'company-a', @fc_manager_a, 'leave', 2, 'approve', '已確認代理安排。', '2026-02-24 11:00:00', '2026-02-24 11:00:00'),
  (2, 'company-a', @fc_manager_a, 'purchase', 2, 'approve', '可列入本月行政採購。', '2026-02-23 15:40:00', '2026-02-23 15:40:00'),
  (3, 'company-b', @fc_manager_b, 'leave', 5, 'reject', '當日人力不足，請改期申請。', '2026-02-27 18:10:00', '2026-02-27 18:10:00');
