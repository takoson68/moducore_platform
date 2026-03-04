CREATE TABLE IF NOT EXISTS dinecore_tables (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  area_name VARCHAR(64) NOT NULL DEFAULT '',
  dine_mode VARCHAR(32) NOT NULL DEFAULT 'dine_in',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  is_ordering_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dinecore_menu_categories (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dinecore_menu_items (
  id VARCHAR(128) NOT NULL PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  base_price INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255) NOT NULL DEFAULT '',
  sold_out TINYINT(1) NOT NULL DEFAULT 0,
  hidden TINYINT(1) NOT NULL DEFAULT 0,
  badge VARCHAR(64) NOT NULL DEFAULT '',
  tone VARCHAR(32) NOT NULL DEFAULT '',
  tags_json LONGTEXT NULL,
  default_note TEXT NULL,
  default_option_ids_json LONGTEXT NULL,
  option_groups_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dinecore_menu_items_category
    FOREIGN KEY (category_id) REFERENCES dinecore_menu_categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  table_code VARCHAR(32) NOT NULL,
  order_status VARCHAR(32) NOT NULL DEFAULT 'draft',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  estimated_wait_minutes INT NULL,
  subtotal_amount INT NOT NULL DEFAULT 0,
  service_fee_amount INT NOT NULL DEFAULT 0,
  tax_amount INT NOT NULL DEFAULT 0,
  total_amount INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dinecore_orders_table_code (table_code),
  CONSTRAINT fk_dinecore_orders_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_order_batches (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  batch_no INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  source_session_token VARCHAR(128) NULL,
  submitted_at DATETIME NULL,
  locked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY ux_dinecore_order_batches_order_batch_no (order_id, batch_no),
  INDEX idx_dinecore_order_batches_order_status (order_id, status),
  CONSTRAINT fk_dinecore_order_batches_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_guest_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  table_code VARCHAR(32) NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  person_slot INT NOT NULL,
  cart_id VARCHAR(64) NOT NULL,
  display_label VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dinecore_guest_sessions_order (order_id),
  INDEX idx_dinecore_guest_sessions_table (table_code),
  CONSTRAINT fk_dinecore_guest_sessions_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_guest_sessions_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_cart_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  batch_id INT UNSIGNED NOT NULL,
  table_code VARCHAR(32) NOT NULL,
  cart_id VARCHAR(64) NOT NULL,
  menu_item_id VARCHAR(128) NOT NULL,
  title VARCHAR(128) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price INT NOT NULL DEFAULT 0,
  note TEXT NULL,
  options_json LONGTEXT NULL,
  selected_option_ids_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dinecore_cart_items_batch_cart (batch_id, cart_id),
  INDEX idx_dinecore_cart_items_order_cart (order_id, cart_id),
  CONSTRAINT fk_dinecore_cart_items_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_cart_items_batch
    FOREIGN KEY (batch_id) REFERENCES dinecore_order_batches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_cart_items_table
    FOREIGN KEY (table_code) REFERENCES dinecore_tables(code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_cart_items_menu_item
    FOREIGN KEY (menu_item_id) REFERENCES dinecore_menu_items(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_order_timeline (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'system',
  note VARCHAR(255) NOT NULL DEFAULT '',
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dinecore_order_timeline_order (order_id),
  CONSTRAINT fk_dinecore_order_timeline_order
    FOREIGN KEY (order_id) REFERENCES dinecore_orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_staff_profiles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  role VARCHAR(32) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dinecore_staff_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_business_closings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_date DATE NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  closed_at DATETIME NULL,
  closed_by_user_id INT UNSIGNED NULL,
  close_reason_type VARCHAR(32) NOT NULL DEFAULT 'daily_close',
  close_reason TEXT NULL,
  unlocked_at DATETIME NULL,
  unlocked_by_user_id INT UNSIGNED NULL,
  unlock_reason_type VARCHAR(32) NULL,
  unlock_reason TEXT NULL,
  locked_scopes_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dinecore_business_closings_closed_by
    FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_dinecore_business_closings_unlocked_by
    FOREIGN KEY (unlocked_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS dinecore_business_closing_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  business_date DATE NOT NULL,
  action VARCHAR(32) NOT NULL,
  actor_user_id INT UNSIGNED NULL,
  actor_name VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  reason TEXT NULL,
  reason_type VARCHAR(32) NOT NULL DEFAULT 'general',
  affected_scopes_json LONGTEXT NULL,
  before_status VARCHAR(32) NOT NULL DEFAULT '',
  after_status VARCHAR(32) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dinecore_business_closing_history_date (business_date),
  CONSTRAINT fk_dinecore_business_closing_history_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);
