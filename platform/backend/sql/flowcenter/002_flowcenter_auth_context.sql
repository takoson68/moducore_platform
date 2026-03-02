CREATE TABLE IF NOT EXISTS flowcenter_user_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    company_id VARCHAR(64) NOT NULL,
    role ENUM('employee', 'manager') NOT NULL,
    display_name VARCHAR(100) NULL,
    status TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_flowcenter_profile_user (user_id),
    INDEX idx_flowcenter_profile_company_role (company_id, role),
    INDEX idx_flowcenter_profile_status (status)
);

INSERT INTO flowcenter_user_profiles (user_id, company_id, role, display_name, status)
VALUES
    (11, 'company-a', 'manager', '流程管理員 A', 1),
    (12, 'company-a', 'employee', '一般員工 A1', 1),
    (13, 'company-a', 'employee', '一般員工 A2', 1),
    (14, 'company-a', 'employee', '一般員工 A3', 1),
    (15, 'company-a', 'employee', '一般員工 A4', 1),
    (16, 'company-b', 'manager', '流程管理員 B', 1),
    (17, 'company-b', 'employee', '一般員工 B1', 1),
    (18, 'company-b', 'employee', '一般員工 B2', 1),
    (19, 'company-b', 'employee', '一般員工 B3', 1),
    (20, 'company-b', 'employee', '一般員工 B4', 1)
ON DUPLICATE KEY UPDATE
    company_id = VALUES(company_id),
    role = VALUES(role),
    display_name = VALUES(display_name),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;
