CREATE TABLE IF NOT EXISTS flowcenter_leave_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    leave_type VARCHAR(32) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted',
    reason TEXT NULL,
    delegate_name VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flowcenter_leave_company_user (company_id, user_id),
    INDEX idx_flowcenter_leave_company_status (company_id, status)
);

CREATE TABLE IF NOT EXISTS flowcenter_purchase_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    purpose TEXT NULL,
    vendor_name VARCHAR(150) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flowcenter_purchase_company_user (company_id, user_id),
    INDEX idx_flowcenter_purchase_company_status (company_id, status)
);

CREATE TABLE IF NOT EXISTS flowcenter_announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    author_user_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    content TEXT NOT NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flowcenter_announcements_company (company_id),
    INDEX idx_flowcenter_announcements_published (company_id, published_at)
);

CREATE TABLE IF NOT EXISTS flowcenter_tasks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    creator_user_id INT UNSIGNED NOT NULL,
    assignee_user_id INT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'medium',
    status VARCHAR(32) NOT NULL DEFAULT 'todo',
    due_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flowcenter_tasks_company (company_id),
    INDEX idx_flowcenter_tasks_company_assignee (company_id, assignee_user_id)
);

CREATE TABLE IF NOT EXISTS flowcenter_approvals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    approver_user_id INT UNSIGNED NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_id INT UNSIGNED NOT NULL,
    decision VARCHAR(32) NOT NULL,
    comment TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_flowcenter_approvals_company_source (company_id, source_type, source_id),
    INDEX idx_flowcenter_approvals_company_approver (company_id, approver_user_id)
);
