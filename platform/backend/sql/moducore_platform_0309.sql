-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： localhost:8889
-- 產生時間： 2026 年 03 月 09 日 13:55
-- 伺服器版本： 8.0.40
-- PHP 版本： 8.3.14

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

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_business_closings`
--

CREATE TABLE `dinecore_business_closings` (
  `id` int UNSIGNED NOT NULL,
  `business_date` date NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `closed_at` datetime DEFAULT NULL,
  `closed_by_user_id` int UNSIGNED DEFAULT NULL,
  `close_reason_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'daily_close',
  `close_reason` text COLLATE utf8mb4_unicode_ci,
  `unlocked_at` datetime DEFAULT NULL,
  `unlocked_by_user_id` int UNSIGNED DEFAULT NULL,
  `unlock_reason_type` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unlock_reason` text COLLATE utf8mb4_unicode_ci,
  `locked_scopes_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_business_closing_history`
--

CREATE TABLE `dinecore_business_closing_history` (
  `id` int UNSIGNED NOT NULL,
  `business_date` date NOT NULL,
  `action` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` int UNSIGNED DEFAULT NULL,
  `actor_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `reason_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `affected_scopes_json` longtext COLLATE utf8mb4_unicode_ci,
  `before_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `after_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_cart_items`
--

CREATE TABLE `dinecore_cart_items` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `batch_id` int UNSIGNED NOT NULL,
  `table_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cart_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu_item_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` int NOT NULL DEFAULT '0',
  `note` text COLLATE utf8mb4_unicode_ci,
  `options_json` longtext COLLATE utf8mb4_unicode_ci,
  `selected_option_ids_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_cart_items`
--

INSERT INTO `dinecore_cart_items` (`id`, `order_id`, `batch_id`, `table_code`, `cart_id`, `menu_item_id`, `title`, `quantity`, `price`, `note`, `options_json`, `selected_option_ids_json`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'A01', 'guest-1', 'winter-plum-tea', '冬梅冰茶', 1, 45, '少冰', '[\"半糖\",\"少冰\"]', '[\"tea-sugar-half\",\"tea-ice-less\"]', '2026-03-05 14:41:30', '2026-03-05 14:41:30'),
(2, 4, 5, 'A01', 'guest-4', 'classic-beef-noodle', '經典牛肉麵', 1, 188, '不要蔥', '[]', '[]', '2026-03-06 20:39:24', '2026-03-06 20:39:24'),
(3, 4, 6, 'A01', 'guest-4', 'chicken-noodle', '嫩雞胸拌麵', 1, 223, '麵加大', '[\"加大\"]', '[\"chicken-size-large\"]', '2026-03-06 20:42:21', '2026-03-06 20:42:21'),
(9, 11, 19, 'A01', 'guest-5', 'classic-beef-noodle', '經典牛肉麵', 1, 188, '不要蔥', '[]', '[]', '2026-03-09 19:05:58', '2026-03-09 19:05:58'),
(10, 12, 21, 'A01', 'guest-6', 'garlic-chicken-noodle', '蒜香雞腿拌麵', 1, 168, '麵加大', '[]', '[]', '2026-03-09 19:25:23', '2026-03-09 19:25:23'),
(11, 12, 21, 'A01', 'guest-6', 'winter-melon-lemon', '冬瓜檸檬', 1, 55, '微冰', '[]', '[]', '2026-03-09 19:25:23', '2026-03-09 19:25:23');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_checkout_submissions`
--

CREATE TABLE `dinecore_checkout_submissions` (
  `id` int UNSIGNED NOT NULL,
  `session_token` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_submission_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int UNSIGNED DEFAULT NULL,
  `submitted_batch_id` int UNSIGNED DEFAULT NULL,
  `submitted_batch_no` int DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'processing',
  `response_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_checkout_submissions`
--

INSERT INTO `dinecore_checkout_submissions` (`id`, `session_token`, `client_submission_id`, `table_code`, `order_id`, `submitted_batch_id`, `submitted_batch_no`, `status`, `response_json`, `created_at`, `updated_at`) VALUES
(6, 'dcs_c819ec0c01041d12ade9cf410bb062f0', 'submit-1773054358792-2gzevxrp', 'A01', 11, 19, 1, 'completed', '{\"ok\":true,\"duplicateHit\":false,\"orderId\":11,\"orderNo\":\"DC202603090005\",\"orderStatus\":\"pending\",\"submittedBatchId\":19,\"submittedBatchNo\":1,\"nextBatchId\":20,\"nextBatchNo\":2,\"successPath\":\"/t/A01/checkout/success/11\",\"trackerPath\":\"/t/A01/order/11\"}', '2026-03-09 19:05:58', '2026-03-09 19:05:58'),
(7, 'dcs_41fe1cf20d48fc2183d89edd6523e44b', 'submit-1773055523380-jtyqgn1d', 'A01', 12, 21, 1, 'completed', '{\"ok\":true,\"duplicateHit\":false,\"orderId\":12,\"orderNo\":\"DC202603090006\",\"orderStatus\":\"pending\",\"submittedBatchId\":21,\"submittedBatchNo\":1,\"nextBatchId\":22,\"nextBatchNo\":2,\"successPath\":\"/t/A01/checkout/success/12\",\"trackerPath\":\"/t/A01/order/12\"}', '2026-03-09 19:25:23', '2026-03-09 19:25:23');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_guest_sessions`
--

CREATE TABLE `dinecore_guest_sessions` (
  `id` int UNSIGNED NOT NULL,
  `session_token` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int UNSIGNED DEFAULT NULL,
  `person_slot` int NOT NULL,
  `cart_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_label` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_guest_sessions`
--

INSERT INTO `dinecore_guest_sessions` (`id`, `session_token`, `table_code`, `order_id`, `person_slot`, `cart_id`, `display_label`, `status`, `created_at`, `last_seen_at`) VALUES
(39, 'dcs_2841224b7d2de9d9b78d8ec67302616e', 'A01', NULL, 1, 'guest-1', '1號顧客', 'expired', '2026-03-04 19:28:18', '2026-03-04 23:04:48'),
(40, 'dcs_c71b794ead7cc358ed4a61af84b2fd15', 'A01', NULL, 2, 'guest-2', '2號顧客', 'expired', '2026-03-04 23:01:14', '2026-03-04 23:04:22'),
(41, 'dcs_1b7e0340d873b4394c17f5e610121be3', 'A01', NULL, 3, 'guest-3', '3號顧客', 'expired', '2026-03-04 23:05:48', '2026-03-04 23:18:33'),
(42, 'dcs_929e9f1b5d678710285fabeeb7953691', 'A01', NULL, 4, 'guest-4', '4號顧客', 'expired', '2026-03-04 23:06:07', '2026-03-04 23:17:45'),
(45, 'dcs_c819ec0c01041d12ade9cf410bb062f0', 'A01', 11, 5, 'guest-5', 'A01-4XD', 'expired', '2026-03-09 19:03:54', '2026-03-09 19:24:59'),
(48, 'dcs_41fe1cf20d48fc2183d89edd6523e44b', 'A01', 12, 6, 'guest-6', 'A01-4MB', 'active', '2026-03-09 19:24:59', '2026-03-09 19:25:34');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_housekeeping_jobs`
--

CREATE TABLE `dinecore_housekeeping_jobs` (
  `id` int UNSIGNED NOT NULL,
  `job_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `locked_until` datetime DEFAULT NULL,
  `meta_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_housekeeping_jobs`
--

INSERT INTO `dinecore_housekeeping_jobs` (`id`, `job_key`, `last_run_at`, `locked_until`, `meta_json`, `created_at`, `updated_at`) VALUES
(1, 'dinecore_guest_cleanup', '2026-03-09 18:59:17', NULL, '[]', '2026-03-09 18:59:17', '2026-03-09 18:59:17');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_menu_categories`
--

CREATE TABLE `dinecore_menu_categories` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_menu_categories`
--

INSERT INTO `dinecore_menu_categories` (`id`, `name`, `sort_order`, `created_at`, `updated_at`) VALUES
('drink', '飲品', 30, '2026-03-04 08:39:43', '2026-03-04 08:49:57'),
('main', '主餐', 20, '2026-03-04 08:39:43', '2026-03-04 08:49:57'),
('new', '新品上市', 50, '2026-03-04 08:39:43', '2026-03-04 08:49:57'),
('popular', '人氣推薦', 10, '2026-03-04 08:39:43', '2026-03-04 08:49:57'),
('seasonal', '季節限定', 40, '2026-03-04 08:39:43', '2026-03-04 08:49:57');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_menu_items`
--

CREATE TABLE `dinecore_menu_items` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `base_price` int NOT NULL DEFAULT '0',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sold_out` tinyint(1) NOT NULL DEFAULT '0',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `badge` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `tone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `tags_json` longtext COLLATE utf8mb4_unicode_ci,
  `default_note` text COLLATE utf8mb4_unicode_ci,
  `default_option_ids_json` longtext COLLATE utf8mb4_unicode_ci,
  `option_groups_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_menu_items`
--

INSERT INTO `dinecore_menu_items` (`id`, `category_id`, `name`, `description`, `base_price`, `image_url`, `sold_out`, `hidden`, `badge`, `tone`, `tags_json`, `default_note`, `default_option_ids_json`, `option_groups_json`, `created_at`, `updated_at`) VALUES
('black-pepper-beef-fried-rice', 'popular', '黑椒牛柳炒飯', '黑胡椒香氣明顯，牛柳與蛋炒飯結合，飽足感高。', 179, 'https://images.pexels.com/photos/35228295/pexels-photo-35228295.jpeg?cs=srgb&dl=pexels-lunny-2150661847-35228295.jpg&fm=jpg', 0, 0, '人氣推薦', 'amber', '[\"炒飯\",\"熱銷\"]', '不要青蔥', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('brown-sugar-milk-tea', 'drink', '黑糖鮮奶茶', '黑糖香氣明顯，奶味厚實，適合做高單價飲品。', 82, 'https://images.pexels.com/photos/8980388/pexels-photo-8980388.jpeg?cs=srgb&dl=pexels-makafood-82669418-8980388.jpg&fm=jpg', 0, 0, '熱銷', 'brown', '[\"飲品\",\"奶茶\",\"熱銷\"]', '微冰', '[\"tea-sugar-normal\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('chicken-noodle', 'main', '嫩雞胸拌麵', '雞胸肉與特製醬汁搭配，份量飽足。', 203, 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg', 0, 0, '', 'sand', '[\"主餐\"]', '麵加大', '[\"chicken-size-large\"]', '[{\"id\": \"chicken-size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"chicken-size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"chicken-size-large\", \"label\": \"加大\", \"price_delta\": 20}]}, {\"id\": \"chicken-extra\", \"label\": \"加料\", \"type\": \"multi\", \"required\": false, \"options\": [{\"id\": \"chicken-extra-egg\", \"label\": \"加蛋\", \"price_delta\": 18}, {\"id\": \"chicken-extra-veggie\", \"label\": \"加青菜\", \"price_delta\": 12}]}]', '2026-03-04 08:39:43', '2026-03-05 21:20:57'),
('classic-beef-noodle', 'main', '經典牛肉麵', '慢燉牛肉搭配清香湯頭，麵條滑順，口感扎實。', 188, 'https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?cs=srgb&dl=pexels-ngqah83-884600.jpg&fm=jpg', 0, 0, '招牌', 'sand', '[\"主餐\",\"熱銷\"]', '不要蔥', '[\"size-regular\",\"spice-normal\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('cold-brew-oolong', 'drink', '冷泡烏龍', '茶湯乾淨、香氣輕盈，適合不喝甜飲的客群。', 48, 'https://images.pexels.com/photos/11009224/pexels-photo-11009224.jpeg?cs=srgb&dl=pexels-shameel-mukkath-3421394-11009224.jpg&fm=jpg', 0, 0, '', 'green', '[\"飲品\",\"無糖\"]', '去冰', '[\"tea-sugar-none\",\"tea-ice-none\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('curry-chicken-cutlet-rice', 'main', '香煎雞排咖哩飯', '酥香雞排搭配濃厚日式咖哩，口味溫和，接受度高。', 198, 'https://images.pexels.com/photos/28668517/pexels-photo-28668517.jpeg?cs=srgb&dl=pexels-tejanotechie-28668517.jpg&fm=jpg', 0, 0, '熱銷', 'sand', '[\"主餐\",\"咖哩\"]', '咖哩多一點', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('fresh-milk-tea', 'drink', '鮮奶茶', '使用鮮奶調和茶底，口感厚實，屬高回購品項。', 72, 'https://images.pexels.com/photos/8980388/pexels-photo-8980388.jpeg?cs=srgb&dl=pexels-makafood-82669418-8980388.jpg&fm=jpg', 0, 0, '人氣推薦', 'sand', '[\"飲品\",\"奶茶\"]', '微糖少冰', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('garlic-chicken-noodle', 'main', '蒜香雞腿拌麵', '蒜香醬汁拌入彈牙細麵，搭配嫩煎雞腿，風味濃郁。', 168, 'https://images.pexels.com/photos/16681314/pexels-photo-16681314.jpeg?cs=srgb&dl=pexels-valeriya-kobzar-42371713-16681314.jpg&fm=jpg', 0, 0, '', 'mint', '[\"主餐\",\"拌麵\"]', '麵加大', '[\"size-regular\",\"spice-mild\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('green-apple-iced-tea', 'drink', '青蘋果冰茶', '淡果香搭配茶底，口味年輕，適合套餐加購。', 68, 'https://images.pexels.com/photos/7703248/pexels-photo-7703248.jpeg?cs=srgb&dl=pexels-korean-jh-30666766-7703248.jpg&fm=jpg', 0, 0, '', 'green', '[\"飲品\",\"果茶\"]', '微糖', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('honey-yuzu-tea', 'drink', '蜂蜜柚子茶', '柚香明亮帶蜂蜜尾韻，冷飲熱飲都適合。', 65, 'https://images.pexels.com/photos/7703248/pexels-photo-7703248.jpeg?cs=srgb&dl=pexels-korean-jh-30666766-7703248.jpg&fm=jpg', 0, 0, '', 'yellow', '[\"飲品\",\"果香\"]', '半糖', '[\"tea-sugar-half\",\"tea-ice-normal\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('hong-kong-milk-tea', 'drink', '絲襪奶茶', '茶味濃厚、奶香滑順，適合作為奶茶主打款。', 70, 'https://images.pexels.com/photos/8980388/pexels-photo-8980388.jpeg?cs=srgb&dl=pexels-makafood-82669418-8980388.jpg&fm=jpg', 0, 0, '熱銷', 'brown', '[\"飲品\",\"奶茶\"]', '少冰', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('iced-black-tea', 'drink', '冰釀紅茶', '茶香乾淨順口，適合搭配炸物與重口味主餐。', 45, 'https://images.pexels.com/photos/11009224/pexels-photo-11009224.jpeg?cs=srgb&dl=pexels-shameel-mukkath-3421394-11009224.jpg&fm=jpg', 0, 0, '招牌', 'sand', '[\"飲品\",\"紅茶\"]', '少冰', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('japanese-chashu-ramen', 'popular', '日式叉燒拉麵', '以清爽醬油湯底搭配叉燒與半熟蛋，口味平衡。', 205, 'https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?cs=srgb&dl=pexels-ngqah83-884600.jpg&fm=jpg', 0, 0, '招牌', 'sand', '[\"拉麵\",\"人氣推薦\"]', '不要木耳', '[\"size-regular\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('kimchi-fried-rice', 'popular', '韓式泡菜炒飯', '酸辣泡菜與蛋炒飯融合，香氣明顯，接受度高。', 158, 'https://images.pexels.com/photos/19969203/pexels-photo-19969203.jpeg?cs=srgb&dl=pexels-markus-winkler-1430818-19969203.jpg&fm=jpg', 0, 0, '熱銷', 'rose', '[\"炒飯\",\"微辣\"]', '加蛋', '[\"single-size-regular\",\"spice-normal\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('kimchi-pork-ramen', 'popular', '泡菜豬肉拉麵', '韓式泡菜微酸微辣，搭配豬肉片與濃湯，風味鮮明。', 196, 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?cs=srgb&dl=pexels-catscoming-1907228.jpg&fm=jpg', 0, 0, '招牌', 'rose', '[\"拉麵\",\"微辣\"]', '加一顆蛋', '[\"size-regular\",\"spice-normal\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('laksa-seafood-noodle', 'seasonal', '南洋叻沙海鮮麵', '椰奶與香料堆疊出南洋風味，海鮮香氣飽滿。', 218, 'https://images.pexels.com/photos/4518666/pexels-photo-4518666.jpeg?cs=srgb&dl=pexels-polina-tankilevitch-4518666.jpg&fm=jpg', 0, 0, '季節限定', 'green', '[\"異國\",\"海鮮\"]', '中辣', '[\"size-regular\",\"spice-hot\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('mushroom-cream-risotto', 'main', '蘑菇奶油燉飯', '奶香滑順、菇香濃郁，適合作為不吃辣的主餐選擇。', 189, 'https://images.pexels.com/photos/5720819/pexels-photo-5720819.jpeg?cs=srgb&dl=pexels-usman-yousaf-708951-5720819.jpg&fm=jpg', 0, 0, '', 'sand', '[\"主餐\",\"奶香\"]', '起司加量', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('osmanthus-black-tea', 'drink', '桂花紅茶', '紅茶帶桂花香氣，口感柔和，適合作為特色茶款。', 58, 'https://images.pexels.com/photos/11009224/pexels-photo-11009224.jpeg?cs=srgb&dl=pexels-shameel-mukkath-3421394-11009224.jpg&fm=jpg', 0, 0, '新品', 'amber', '[\"飲品\",\"花香\"]', '微糖', '[\"tea-sugar-half\",\"tea-ice-normal\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('passionfruit-green-tea', 'drink', '百香綠茶', '百香果酸甜突出，綠茶尾韻清爽，夏季接受度高。', 60, 'https://images.pexels.com/photos/7703248/pexels-photo-7703248.jpeg?cs=srgb&dl=pexels-korean-jh-30666766-7703248.jpg&fm=jpg', 0, 0, '', 'yellow', '[\"飲品\",\"果茶\"]', '半糖少冰', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('pepper-chicken-rice', 'main', '椒麻雞拌飯', '外酥內嫩雞腿排淋上椒麻醬，酸香微辣，層次鮮明。', 185, 'https://images.pexels.com/photos/28668517/pexels-photo-28668517.jpeg?cs=srgb&dl=pexels-tejanotechie-28668517.jpg&fm=jpg', 0, 0, '', 'rose', '[\"主餐\",\"微辣\"]', '醬另外放', '[\"single-size-regular\",\"spice-normal\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('red-oil-wonton-noodle', 'main', '川味紅油抄手麵', '紅油香麻帶勁，抄手飽滿，適合偏重口味的客群。', 162, 'https://images.pexels.com/photos/16681314/pexels-photo-16681314.jpeg?cs=srgb&dl=pexels-valeriya-kobzar-42371713-16681314.jpg&fm=jpg', 0, 0, '', 'rose', '[\"主餐\",\"麻辣\"]', '小辣', '[\"size-regular\",\"spice-hot\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('salt-lemon-chicken-cold-noodle', 'seasonal', '海鹽檸檬雞絲冷麵', '清爽檸檬香結合雞絲與冷麵，炎熱天氣賣相佳。', 152, 'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?cs=srgb&dl=pexels-enginakyurt-2456435.jpg&fm=jpg', 0, 0, '季節限定', 'mint', '[\"冷麵\",\"清爽\"]', '不要小黃瓜', '[\"size-regular\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('scallion-beef-rice', 'main', '蔥爆牛肉燴飯', '大火快炒牛肉與洋蔥，醬香濃厚，適合重口味客群。', 176, 'https://images.pexels.com/photos/28668517/pexels-photo-28668517.jpeg?cs=srgb&dl=pexels-tejanotechie-28668517.jpg&fm=jpg', 0, 0, '', 'amber', '[\"主餐\",\"燴飯\"]', '飯少', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('seafood-soup-noodle', 'main', '海鮮湯麵', '以海鮮高湯為底，搭配鮮蝦與花枝，清爽耐吃。', 199, 'https://images.pexels.com/photos/4518666/pexels-photo-4518666.jpeg?cs=srgb&dl=pexels-polina-tankilevitch-4518666.jpg&fm=jpg', 0, 0, '', 'blue', '[\"主餐\",\"湯麵\"]', '不要香菜', '[\"size-regular\",\"spice-normal\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('seaweed-noodle-signature', 'seasonal', '經典海藻涼麵', '海藻麵搭配招牌醬汁與清爽配菜，適合夏季主打。', 154, 'https://www.themealdb.com/images/media/meals/1529445893.jpg', 0, 0, '人氣推薦', 'green', '[\"招牌\", \"季節限定\"]', '不要香菜', '[\"size-regular\", \"spice-normal\"]', '[{\"id\": \"size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"size-large\", \"label\": \"加大\", \"price_delta\": 20}]}, {\"id\": \"spice\", \"label\": \"辣度\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"spice-mild\", \"label\": \"小辣\", \"price_delta\": 0}, {\"id\": \"spice-normal\", \"label\": \"正常\", \"price_delta\": 0}, {\"id\": \"spice-hot\", \"label\": \"大辣\", \"price_delta\": 10}]}, {\"id\": \"garnish\", \"label\": \"加料\", \"type\": \"multi\", \"required\": false, \"options\": [{\"id\": \"garnish-scallion\", \"label\": \"加蔥\", \"price_delta\": 5}, {\"id\": \"garnish-egg\", \"label\": \"加蛋\", \"price_delta\": 18}]}]', '2026-03-04 08:39:43', '2026-03-05 21:21:13'),
('seaweed-noodle-single', 'popular', '單點海藻涼麵', '單點版本，適合小份量或搭配飲品。', 99, 'https://www.themealdb.com/images/media/meals/1529446137.jpg', 0, 0, '', 'mint', '[\"單點\"]', '', '[\"single-size-regular\"]', '[{\"id\": \"single-size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"single-size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"single-size-large\", \"label\": \"加大\", \"price_delta\": 15}]}]', '2026-03-04 08:39:43', '2026-03-05 21:21:22'),
('sesame-cold-noodle', 'seasonal', '胡麻冷麵', '胡麻醬香濃郁，搭配爽口小黃瓜絲，適合夏季販售。', 145, 'https://images.pexels.com/photos/2456435/pexels-photo-2456435.jpeg?cs=srgb&dl=pexels-enginakyurt-2456435.jpg&fm=jpg', 0, 0, '季節限定', 'mint', '[\"季節限定\",\"冷麵\"]', '醬少一點', '[\"size-regular\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('sesame-oil-chicken-noodle', 'seasonal', '麻油雞湯麵', '麻油與老薑香氣突出，湯頭溫潤，適合秋冬檔期。', 198, 'https://images.pexels.com/photos/4518666/pexels-photo-4518666.jpeg?cs=srgb&dl=pexels-polina-tankilevitch-4518666.jpg&fm=jpg', 0, 0, '季節限定', 'sand', '[\"季節限定\",\"湯麵\"]', '酒味淡一點', '[\"size-regular\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('short-rib-fried-rice', 'seasonal', '炙燒牛小排炒飯', '炙燒牛小排搭配蛋炒飯，油香與肉香兼具。', 239, 'https://images.pexels.com/photos/35228295/pexels-photo-35228295.jpeg?cs=srgb&dl=pexels-lunny-2150661847-35228295.jpg&fm=jpg', 0, 0, '季節限定', 'amber', '[\"季節限定\",\"炒飯\"]', '不要洋蔥', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('shrimp-fried-rice', 'popular', '招牌蝦仁炒飯', '粒粒分明的炒飯配上鮮蝦與蛋香，是穩定熱賣款。', 169, 'https://images.pexels.com/photos/34683317/pexels-photo-34683317.jpeg?cs=srgb&dl=pexels-undo-kim-2153633398-34683317.jpg&fm=jpg', 0, 0, '人氣推薦', 'green', '[\"招牌\",\"炒飯\"]', '飯硬一點', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('smoked-plum-juice', 'drink', '烏梅汁', '酸甜平衡，帶有微微煙燻感，解膩效果好。', 50, 'https://images.pexels.com/photos/24304857/pexels-photo-24304857.jpeg?cs=srgb&dl=pexels-matvalina-24304857.jpg&fm=jpg', 0, 0, '', 'indigo', '[\"飲品\",\"古早味\"]', '少冰', '[\"tea-sugar-normal\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('sparkling-lemon-black-tea', 'drink', '檸檬氣泡紅茶', '茶香、氣泡與檸檬酸感結合，視覺與口感都清爽。', 75, 'https://images.pexels.com/photos/27601314/pexels-photo-27601314.jpeg?cs=srgb&dl=pexels-su-hao-1481871440-27601314.jpg&fm=jpg', 0, 0, '新品', 'mint', '[\"飲品\",\"氣泡\"]', '正常冰', '[\"tea-sugar-half\",\"tea-ice-normal\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('spicy-tonkotsu-ramen', 'popular', '麻辣豚骨拉麵', '濃郁豚骨湯底結合微辣香氣，叉燒與半熟蛋層次完整。', 209, 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?cs=srgb&dl=pexels-catscoming-1907228.jpg&fm=jpg', 0, 0, '人氣推薦', 'rose', '[\"招牌\",\"人氣推薦\"]', '不要木耳', '[\"size-regular\",\"spice-hot\"]', '[{\"id\":\"size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('thai-basil-pork-rice', 'main', '泰式打拋豬飯', '九層塔與辣香拌炒豬肉末，鹹香開胃，適合午餐時段。', 159, 'https://images.pexels.com/photos/5409019/pexels-photo-5409019.jpeg?cs=srgb&dl=pexels-momo-king-3616480-5409019.jpg&fm=jpg', 0, 0, '', 'green', '[\"主餐\",\"異國\"]', '加蛋', '[\"single-size-regular\",\"spice-normal\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true},{\"id\":\"spice\",\"label\":\"辣度\",\"type\":\"single\",\"required\":false}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('three-cup-chicken-rice', 'main', '三杯雞燴飯', '九層塔與薑片拌炒雞肉，醬香濃厚，白飯吸附力強。', 172, 'https://images.pexels.com/photos/28668517/pexels-photo-28668517.jpeg?cs=srgb&dl=pexels-tejanotechie-28668517.jpg&fm=jpg', 0, 0, '', 'amber', '[\"主餐\",\"台式\"]', '不要薑', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('truffle-mushroom-risotto', 'seasonal', '松露野菇燉飯', '淡雅松露香氣搭配野菇與奶油燉飯，口感細膩。', 228, 'https://images.pexels.com/photos/5720819/pexels-photo-5720819.jpeg?cs=srgb&dl=pexels-usman-yousaf-708951-5720819.jpg&fm=jpg', 0, 0, '季節限定', 'indigo', '[\"季節限定\",\"奶香\"]', '飯煮硬一點', '[\"single-size-regular\"]', '[{\"id\":\"single-size\",\"label\":\"份量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('winter-melon-lemon', 'drink', '冬瓜檸檬', '冬瓜茶甜香搭配檸檬酸感，清爽解膩。', 55, 'https://images.pexels.com/photos/518591/pexels-photo-518591.jpeg?cs=srgb&dl=pexels-fox-58267-518591.jpg&fm=jpg', 0, 0, '', 'amber', '[\"飲品\",\"清爽\"]', '微冰', '[\"tea-sugar-half\",\"tea-ice-less\"]', '[{\"id\":\"tea-sugar\",\"label\":\"甜度\",\"type\":\"single\",\"required\":true},{\"id\":\"tea-ice\",\"label\":\"冰量\",\"type\":\"single\",\"required\":true}]', '2026-03-06 11:30:00', '2026-03-06 11:30:00'),
('winter-plum-tea', 'drink', '冬梅冰茶', '酸甜清爽，適合搭配涼麵。', 45, 'https://www.themealdb.com/images/media/meals/1529446352.jpg', 0, 0, '', 'amber', '[\"飲品\"]', '少冰', '[\"tea-sugar-half\", \"tea-ice-less\"]', '[{\"id\": \"tea-sugar\", \"label\": \"甜度\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"tea-sugar-none\", \"label\": \"無糖\", \"price_delta\": 0}, {\"id\": \"tea-sugar-half\", \"label\": \"半糖\", \"price_delta\": 0}, {\"id\": \"tea-sugar-normal\", \"label\": \"正常\", \"price_delta\": 0}]}, {\"id\": \"tea-ice\", \"label\": \"冰量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"tea-ice-none\", \"label\": \"去冰\", \"price_delta\": 0}, {\"id\": \"tea-ice-less\", \"label\": \"少冰\", \"price_delta\": 0}, {\"id\": \"tea-ice-normal\", \"label\": \"正常\", \"price_delta\": 0}]}]', '2026-03-04 08:39:43', '2026-03-05 21:21:29');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_orders`
--

CREATE TABLE `dinecore_orders` (
  `id` int UNSIGNED NOT NULL,
  `order_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `payment_status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_method` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `estimated_wait_minutes` int DEFAULT NULL,
  `subtotal_amount` int NOT NULL DEFAULT '0',
  `service_fee_amount` int NOT NULL DEFAULT '0',
  `tax_amount` int NOT NULL DEFAULT '0',
  `total_amount` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_orders`
--

INSERT INTO `dinecore_orders` (`id`, `order_no`, `table_code`, `order_status`, `payment_status`, `payment_method`, `estimated_wait_minutes`, `subtotal_amount`, `service_fee_amount`, `tax_amount`, `total_amount`, `created_at`, `updated_at`) VALUES
(1, 'DC202603050001', 'A01', 'picked_up', 'paid', 'cash', 18, 45, 2, 1, 48, '2026-03-05 14:41:16', '2026-03-09 19:24:51'),
(2, 'DC202603060001', 'A01', 'draft', 'unpaid', 'unpaid', NULL, 0, 0, 0, 0, '2026-03-06 19:47:34', '2026-03-06 19:47:34'),
(3, 'DC202603060002', 'A01', 'draft', 'unpaid', 'unpaid', NULL, 0, 0, 0, 0, '2026-03-06 19:48:56', '2026-03-06 19:48:56'),
(4, 'DC202603060003', 'A01', 'picked_up', 'paid', 'cash', 18, 411, 21, 10, 442, '2026-03-06 19:49:18', '2026-03-09 19:24:50'),
(5, 'DC202603070001', 'A01', 'draft', 'unpaid', 'unpaid', NULL, 0, 0, 0, 0, '2026-03-07 21:46:34', '2026-03-07 21:46:34'),
(6, 'DC202603080001', 'A01', 'draft', 'unpaid', 'unpaid', NULL, 0, 0, 0, 0, '2026-03-08 20:29:59', '2026-03-08 20:29:59'),
(11, 'DC202603090005', 'A01', 'picked_up', 'paid', 'cash', 18, 188, 9, 5, 202, '2026-03-09 19:05:58', '2026-03-09 19:24:54'),
(12, 'DC202603090006', 'A01', 'pending', 'unpaid', 'unpaid', 18, 223, 11, 6, 240, '2026-03-09 19:25:23', '2026-03-09 19:25:23');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_order_batches`
--

CREATE TABLE `dinecore_order_batches` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `batch_no` int NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `source_session_token` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_order_batches`
--

INSERT INTO `dinecore_order_batches` (`id`, `order_id`, `batch_no`, `status`, `source_session_token`, `submitted_at`, `locked_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'picked_up', 'dcs_e960b0a41f8abe230df7871cb8b4def7', '2026-03-05 14:41:45', '2026-03-05 14:41:45', '2026-03-05 14:41:16', '2026-03-09 19:06:32'),
(2, 1, 2, 'draft', NULL, NULL, NULL, '2026-03-05 14:41:45', '2026-03-05 14:41:45'),
(3, 2, 1, 'draft', NULL, NULL, NULL, '2026-03-06 19:47:34', '2026-03-06 19:47:34'),
(4, 3, 1, 'draft', NULL, NULL, NULL, '2026-03-06 19:48:56', '2026-03-06 19:48:56'),
(5, 4, 1, 'picked_up', 'dcs_7e10f85bbbd63c53218b67255c93a8bc', '2026-03-06 20:39:31', '2026-03-06 20:39:31', '2026-03-06 19:49:18', '2026-03-09 19:06:35'),
(6, 4, 2, 'picked_up', 'dcs_7e10f85bbbd63c53218b67255c93a8bc', '2026-03-06 20:42:26', '2026-03-06 20:42:26', '2026-03-06 20:39:31', '2026-03-09 19:06:37'),
(7, 4, 3, 'draft', NULL, NULL, NULL, '2026-03-06 20:42:26', '2026-03-06 20:42:26'),
(8, 5, 1, 'draft', NULL, NULL, NULL, '2026-03-07 21:46:34', '2026-03-07 21:46:34'),
(9, 6, 1, 'draft', NULL, NULL, NULL, '2026-03-08 20:29:59', '2026-03-08 20:29:59'),
(19, 11, 1, 'picked_up', 'dcs_c819ec0c01041d12ade9cf410bb062f0', '2026-03-09 19:05:58', '2026-03-09 19:05:58', '2026-03-09 19:05:58', '2026-03-09 19:24:54'),
(20, 11, 2, 'draft', NULL, NULL, NULL, '2026-03-09 19:05:58', '2026-03-09 19:05:58'),
(21, 12, 1, 'submitted', 'dcs_41fe1cf20d48fc2183d89edd6523e44b', '2026-03-09 19:25:23', '2026-03-09 19:25:23', '2026-03-09 19:25:23', '2026-03-09 19:25:23'),
(22, 12, 2, 'draft', NULL, NULL, NULL, '2026-03-09 19:25:23', '2026-03-09 19:25:23');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_order_merge_records`
--

CREATE TABLE `dinecore_order_merge_records` (
  `id` int UNSIGNED NOT NULL,
  `target_order_id` int UNSIGNED NOT NULL,
  `merged_order_id` int UNSIGNED NOT NULL,
  `table_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `merged_by_user_id` int UNSIGNED DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `snapshot_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_order_timeline`
--

CREATE TABLE `dinecore_order_timeline` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_order_timeline`
--

INSERT INTO `dinecore_order_timeline` (`id`, `order_id`, `status`, `source`, `note`, `changed_at`) VALUES
(1, 1, 'pending', 'customer', '憿批恥撌脤閮', '2026-03-05 14:41:45'),
(2, 4, 'pending', 'customer', 'Customer submitted order', '2026-03-06 20:39:31'),
(3, 4, 'pending', 'customer', 'Customer submitted order', '2026-03-06 20:42:26'),
(11, 11, 'pending', 'customer', 'Customer submitted batch 1', '2026-03-09 19:05:58'),
(12, 1, 'picked_up', 'kitchen', 'Kitchen updated batch 1 status to picked_up', '2026-03-09 19:06:32'),
(13, 4, 'picked_up', 'kitchen', 'Kitchen updated batch 1 status to picked_up', '2026-03-09 19:06:35'),
(14, 4, 'picked_up', 'kitchen', 'Kitchen updated batch 2 status to picked_up', '2026-03-09 19:06:37'),
(18, 11, 'ready', 'kitchen', 'Kitchen updated batch 1 status to ready', '2026-03-09 19:24:46'),
(19, 11, 'ready', 'counter', 'Counter updated payment status to paid', '2026-03-09 19:24:49'),
(20, 4, 'picked_up', 'counter', 'Counter updated payment status to paid', '2026-03-09 19:24:50'),
(21, 1, 'picked_up', 'counter', 'Counter updated payment status to paid', '2026-03-09 19:24:51'),
(22, 11, 'picked_up', 'kitchen', 'Kitchen updated batch 1 status to picked_up', '2026-03-09 19:24:54'),
(23, 12, 'pending', 'customer', 'Customer submitted batch 1', '2026-03-09 19:25:23');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_staff_profiles`
--

CREATE TABLE `dinecore_staff_profiles` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_staff_profiles`
--

INSERT INTO `dinecore_staff_profiles` (`id`, `user_id`, `role`, `display_name`, `status`, `created_at`, `updated_at`) VALUES
(5, 31, 'manager', '管理者', 1, '2026-03-05 20:26:33', '2026-03-05 20:26:33'),
(6, 32, 'deputy_manager', '副店長', 1, '2026-03-05 20:26:33', '2026-03-05 20:26:33'),
(7, 33, 'counter', '櫃台人員', 1, '2026-03-05 20:26:33', '2026-03-05 20:26:33'),
(8, 34, 'kitchen', '廚房人員', 1, '2026-03-05 20:26:33', '2026-03-05 20:26:33');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_tables`
--

CREATE TABLE `dinecore_tables` (
  `id` int UNSIGNED NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `dine_mode` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine_in',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_ordering_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_tables`
--

INSERT INTO `dinecore_tables` (`id`, `code`, `name`, `area_name`, `dine_mode`, `status`, `is_ordering_enabled`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'A01', 'A01 桌', '內用區', 'dine_in', 'active', 1, 1, '2026-03-03 22:56:21', '2026-03-03 22:56:21');

-- --------------------------------------------------------

--
-- 資料表結構 `dinecore_table_sessions`
--

CREATE TABLE `dinecore_table_sessions` (
  `id` int UNSIGNED NOT NULL,
  `table_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int UNSIGNED DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'closed',
  `started_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `guest_state_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `dinecore_table_sessions`
--

INSERT INTO `dinecore_table_sessions` (`id`, `table_code`, `order_id`, `status`, `started_at`, `closed_at`, `guest_state_json`, `created_at`, `updated_at`) VALUES
(1, 'A01', 12, 'active', '2026-03-05 22:31:50', NULL, '[]', '2026-03-05 20:20:14', '2026-03-09 19:25:34');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_announcements`
--

CREATE TABLE `flowcenter_announcements` (
  `id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_user_id` int UNSIGNED NOT NULL,
  `title` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_announcements`
--

INSERT INTO `flowcenter_announcements` (`id`, `company_id`, `author_user_id`, `title`, `content`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'company-a', 21, '三月部門週會', '請各部門於週三上午 10:00 準時參與月會。', '2026-03-01 08:00:00', '2026-03-01 07:50:00', '2026-03-01 08:00:00'),
(2, 'company-a', 21, 'Q2 訓練課程草案', '培訓課表草案已完成，請主管先行檢視。', NULL, '2026-03-01 11:20:00', '2026-03-01 11:20:00'),
(3, 'company-b', 26, '公司 B 倉儲盤點', '本週五下午進行盤點，出貨流程將提前截止。', '2026-03-01 09:10:00', '2026-03-01 09:00:00', '2026-03-01 09:10:00');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_approvals`
--

CREATE TABLE `flowcenter_approvals` (
  `id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approver_user_id` int UNSIGNED NOT NULL,
  `source_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_id` int UNSIGNED NOT NULL,
  `decision` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_approvals`
--

INSERT INTO `flowcenter_approvals` (`id`, `company_id`, `approver_user_id`, `source_type`, `source_id`, `decision`, `comment`, `created_at`, `updated_at`) VALUES
(1, 'company-a', 21, 'leave', 2, 'approve', '已確認代理安排。', '2026-02-24 11:00:00', '2026-02-24 11:00:00'),
(2, 'company-a', 21, 'purchase', 2, 'approve', '可列入本月行政採購。', '2026-02-23 15:40:00', '2026-02-23 15:40:00'),
(3, 'company-b', 26, 'leave', 5, 'reject', '當日人力不足，請改期申請。', '2026-02-27 18:10:00', '2026-02-27 18:10:00');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_leave_requests`
--

CREATE TABLE `flowcenter_leave_requests` (
  `id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `leave_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` decimal(5,2) NOT NULL DEFAULT '1.00',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `delegate_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_leave_requests`
--

INSERT INTO `flowcenter_leave_requests` (`id`, `company_id`, `user_id`, `leave_type`, `start_date`, `end_date`, `days`, `status`, `reason`, `delegate_name`, `created_at`, `updated_at`) VALUES
(1, 'company-a', 22, 'annual', '2026-03-10', '2026-03-12', 3.00, 'submitted', '家庭旅遊', '一般員工 A2', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(2, 'company-a', 23, 'sick', '2026-02-25', '2026-02-25', 1.00, 'approved', '感冒就醫', '一般員工 A1', '2026-02-24 08:30:00', '2026-02-24 11:00:00'),
(3, 'company-a', 24, 'personal', '2026-03-15', '2026-03-15', 1.00, 'draft', '處理私人事務', '一般員工 A4', '2026-03-01 14:20:00', '2026-03-01 14:20:00'),
(4, 'company-b', 27, 'annual', '2026-03-08', '2026-03-09', 2.00, 'submitted', '返鄉安排', '一般員工 B2', '2026-03-01 10:40:00', '2026-03-01 10:40:00'),
(5, 'company-b', 28, 'personal', '2026-02-28', '2026-02-28', 1.00, 'rejected', '銀行辦理文件', '一般員工 B1', '2026-02-27 16:00:00', '2026-02-27 18:10:00');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_purchase_requests`
--

CREATE TABLE `flowcenter_purchase_requests` (
  `id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `item_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `purpose` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `vendor_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_purchase_requests`
--

INSERT INTO `flowcenter_purchase_requests` (`id`, `company_id`, `user_id`, `item_name`, `amount`, `purpose`, `vendor_name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'company-a', 22, '27 吋顯示器', 9800.00, '提升多工處理效率', 'ViewBest', 'submitted', '2026-03-01 13:00:00', '2026-03-01 13:00:00'),
(2, 'company-a', 23, '會議室白板', 3200.00, '產品討論會議使用', 'Office Pro', 'approved', '2026-02-23 09:30:00', '2026-02-23 15:40:00'),
(3, 'company-a', 25, '人體工學鍵盤', 2600.00, '改善長時間輸入體驗', 'KeyWorks', 'draft', '2026-03-01 17:10:00', '2026-03-01 17:10:00');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_tasks`
--

CREATE TABLE `flowcenter_tasks` (
  `id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creator_user_id` int UNSIGNED NOT NULL,
  `assignee_user_id` int UNSIGNED DEFAULT NULL,
  `title` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `priority` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'todo',
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_tasks`
--

INSERT INTO `flowcenter_tasks` (`id`, `company_id`, `creator_user_id`, `assignee_user_id`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`, `updated_at`) VALUES
(1, 'company-a', 21, 22, '整理請假制度 FAQ', '補齊新人常見問題與流程說明。', 'high', 'doing', '2026-03-06', '2026-03-01 08:40:00', '2026-03-01 09:30:00'),
(2, 'company-a', 22, 23, '採購規格比價', '針對顯示器需求整理三家供應商報價。', 'medium', 'todo', '2026-03-05', '2026-03-01 13:30:00', '2026-03-01 13:30:00'),
(3, 'company-a', 23, NULL, '整理月報數據', '彙整本月專案 KPI 與風險摘要。', 'low', 'done', '2026-02-28', '2026-02-26 16:00:00', '2026-02-28 18:20:00'),
(4, 'company-b', 26, 27, '更新倉儲值班表', '請依新排班規則更新共享文件。', 'medium', 'todo', '2026-03-04', '2026-03-01 10:00:00', '2026-03-01 10:00:00');

-- --------------------------------------------------------

--
-- 資料表結構 `flowcenter_user_profiles`
--

CREATE TABLE `flowcenter_user_profiles` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `company_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('employee','manager') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `flowcenter_user_profiles`
--

INSERT INTO `flowcenter_user_profiles` (`id`, `user_id`, `company_id`, `role`, `display_name`, `status`, `created_at`, `updated_at`) VALUES
(1, 21, 'company-a', 'manager', '流程管理員 A', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(2, 22, 'company-a', 'employee', '一般員工 A1', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(3, 23, 'company-a', 'employee', '一般員工 A2', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(4, 24, 'company-a', 'employee', '一般員工 A3', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(5, 25, 'company-a', 'employee', '一般員工 A4', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(6, 26, 'company-b', 'manager', '流程管理員 B', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(7, 27, 'company-b', 'employee', '一般員工 B1', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(8, 28, 'company-b', 'employee', '一般員工 B2', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(9, 29, 'company-b', 'employee', '一般員工 B3', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03'),
(10, 30, 'company-b', 'employee', '一般員工 B4', 1, '2026-03-02 21:33:03', '2026-03-02 21:33:03');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_employees`
--

CREATE TABLE `project_b_employees` (
  `id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `department` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(32) NOT NULL DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_employees`
--

INSERT INTO `project_b_employees` (`id`, `member_id`, `user_id`, `name`, `title`, `department`, `email`, `phone`, `status`, `created_at`, `updated_at`, `role`) VALUES
(1, 1, 11, 'Alex Chen', 'Engineer', 'R&D', 'alex.chen@example.com', '0900-000-001', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'super_admin'),
(2, 2, 12, 'Bella Lin', 'Designer', 'Design', 'bella.lin@example.com', '0900-000-002', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'manager'),
(3, 3, 13, 'Chris Wang', 'Product Manager', 'Product', 'chris.wang@example.com', '0900-000-003', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(4, 4, 14, 'Diana Lee', 'Marketing', 'Marketing', 'diana.lee@example.com', '0900-000-004', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(5, 5, 15, 'Evan Wu', 'Customer Lead', 'Support', 'evan.wu@example.com', '0900-000-005', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(6, 6, 16, 'Fiona Kao', 'HR', 'HR', 'fiona.kao@example.com', '0900-000-006', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(7, 7, 17, 'Gary Ho', 'QA', 'QA', 'gary.ho@example.com', '0900-000-007', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(8, 8, 18, 'Helen Tsai', 'Finance', 'Finance', 'helen.tsai@example.com', '0900-000-008', 'inactive', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(9, 9, 19, 'Ian Huang', 'Sales', 'Sales', 'ian.huang@example.com', '0900-000-009', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff'),
(10, 10, 20, 'Jane Lu', 'Ops', 'Operations', 'jane.lu@example.com', '0900-000-010', 'active', '2026-01-28 22:00:56', '2026-01-28 22:46:46', 'staff');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_notifications`
--

CREATE TABLE `project_b_notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `type` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_notifications`
--

INSERT INTO `project_b_notifications` (`id`, `member_id`, `type`, `title`, `content`, `is_read`, `read_at`, `created_at`) VALUES
(1, 1, 'system', 'Maintenance notice', 'System maintenance scheduled at 23:00.', 1, '2026-02-07 15:26:41', '2026-01-22 18:00:00'),
(2, 2, 'task', 'Task update', 'Login panel task moved to doing.', 1, '2026-01-23 09:10:00', '2026-01-23 09:00:00'),
(3, 3, 'vote', 'New vote', 'Please vote on Q1 project codename.', 0, NULL, '2026-01-23 10:00:00'),
(4, 4, 'system', 'Policy update', 'Remote work policy updated.', 1, '2026-01-24 11:20:00', '2026-01-24 10:00:00'),
(5, 5, 'task', 'Assignment', 'You were assigned to support scripts task.', 0, NULL, '2026-01-24 14:00:00'),
(6, 6, 'system', 'HR announcement', 'New benefits enrollment opens next week.', 0, NULL, '2026-01-25 09:00:00'),
(7, 7, 'task', 'Regression started', 'QA regression checklist started.', 1, '2026-01-25 10:15:00', '2026-01-25 09:30:00'),
(8, 8, 'finance', 'Expense reminder', 'Please submit January receipts.', 0, NULL, '2026-01-26 09:00:00'),
(9, 9, 'sales', 'Pipeline review', 'Weekly pipeline review at 15:00.', 1, '2026-01-26 15:05:00', '2026-01-26 14:00:00'),
(10, 10, 'ops', 'Backup check', 'Backup verification in progress.', 0, NULL, '2026-01-26 16:00:00'),
(11, 1, 'vote', '新增投票', '投票「11111」已建立', 0, NULL, '2026-02-07 15:26:27');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_tasks`
--

CREATE TABLE `project_b_tasks` (
  `id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `publisher_member_id` bigint UNSIGNED NOT NULL,
  `assignee_member_id` bigint UNSIGNED DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `status` enum('todo','doing','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_tasks`
--

INSERT INTO `project_b_tasks` (`id`, `member_id`, `publisher_member_id`, `assignee_member_id`, `title`, `description`, `status`, `priority`, `due_date`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 'Set up onboarding', 'Prepare onboarding checklist and accounts.', 'todo', 'high', '2026-02-10', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(2, 2, 2, 3, 'Design login panel', 'Draft UI variants for login panel.', 'doing', 'medium', '2026-02-05', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(3, 3, 3, 4, 'Prepare product brief', 'Summarize Q1 scope and milestones.', 'todo', 'medium', '2026-02-12', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(4, 4, 4, 5, 'Marketing campaign', 'Plan February campaign assets.', 'todo', 'low', '2026-02-20', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(5, 5, 5, 6, 'Support scripts', 'Update support response templates.', 'doing', 'medium', '2026-02-08', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(6, 6, 6, 7, 'HR policy update', 'Revise remote work policy draft.', 'done', 'low', '2026-01-31', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(7, 7, 7, 8, 'QA regression', 'Run regression checklist for release.', 'doing', 'high', '2026-02-03', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(8, 8, 8, 9, 'Finance report', 'Compile monthly expense report.', 'todo', 'medium', '2026-02-15', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(9, 9, 9, 10, 'Sales pipeline', 'Clean up pipeline and follow-ups.', 'todo', 'medium', '2026-02-18', '2026-01-28 22:00:57', '2026-01-28 22:00:57'),
(10, 10, 10, 1, 'Ops checklist', 'Verify infra and backups.', 'doing', 'high', '2026-02-06', '2026-01-28 22:00:57', '2026-01-28 22:00:57');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_task_events`
--

CREATE TABLE `project_b_task_events` (
  `id` bigint UNSIGNED NOT NULL,
  `task_id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED DEFAULT NULL,
  `event_type` enum('system','note') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(12, 10, 10, 'note', 'Backup verification in progress.', '2026-01-26 16:10:00');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_task_members`
--

CREATE TABLE `project_b_task_members` (
  `id` bigint UNSIGNED NOT NULL,
  `task_id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `role` enum('participant','watcher') NOT NULL DEFAULT 'participant',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_task_members`
--

INSERT INTO `project_b_task_members` (`id`, `task_id`, `member_id`, `role`, `created_at`) VALUES
(1, 1, 1, 'participant', '2026-01-28 22:00:57'),
(2, 1, 2, 'watcher', '2026-01-28 22:00:57'),
(3, 2, 2, 'participant', '2026-01-28 22:00:57'),
(4, 2, 3, 'watcher', '2026-01-28 22:00:57'),
(5, 3, 3, 'participant', '2026-01-28 22:00:57'),
(6, 4, 4, 'participant', '2026-01-28 22:00:57'),
(7, 5, 5, 'participant', '2026-01-28 22:00:57'),
(8, 6, 6, 'participant', '2026-01-28 22:00:57'),
(9, 7, 7, 'participant', '2026-01-28 22:00:57'),
(10, 8, 8, 'participant', '2026-01-28 22:00:57'),
(11, 9, 9, 'participant', '2026-01-28 22:00:57'),
(12, 10, 10, 'participant', '2026-01-28 22:00:57'),
(13, 7, 1, 'watcher', '2026-01-28 22:00:57'),
(14, 5, 2, 'watcher', '2026-01-28 22:00:57'),
(15, 3, 4, 'watcher', '2026-01-28 22:00:57');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_votes`
--

CREATE TABLE `project_b_votes` (
  `id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `allow_multiple` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `rule_mode` enum('all','time') NOT NULL DEFAULT 'all',
  `rule_deadline` datetime DEFAULT NULL,
  `rule_total_voters` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `anonymous` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_votes`
--

INSERT INTO `project_b_votes` (`id`, `member_id`, `title`, `description`, `allow_multiple`, `status`, `rule_mode`, `rule_deadline`, `rule_total_voters`, `created_at`, `updated_at`, `anonymous`) VALUES
(1, 1, 'Project codename', 'Choose the Q1 codename.', 0, 'open', 'all', NULL, 10, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(2, 2, 'Office seating', 'Preferred seating area.', 1, 'open', 'time', '2026-02-10 18:00:00', 0, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(3, 3, 'Team outing', 'Vote for annual outing location.', 1, 'closed', 'time', '2026-01-20 12:00:00', 0, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(4, 4, 'Tooling', 'Pick a new issue tracker.', 0, 'open', 'all', NULL, 12, '2026-01-28 22:00:57', '2026-01-28 22:12:14', 1),
(5, 5, 'Lunch policy', 'Choose lunch stipend option.', 0, 'open', 'time', '2026-02-05 12:00:00', 0, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(6, 6, 'Training topic', 'Pick a training topic for February.', 1, 'open', 'all', NULL, 0, '2026-01-28 22:00:57', '2026-01-28 22:12:14', 1),
(7, 7, 'QA checklist', 'Select checklist version to adopt.', 0, 'closed', 'time', '2026-01-15 18:00:00', 0, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(8, 8, 'Finance tool', 'Pick expense tool for Q2.', 0, 'open', 'all', NULL, 8, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(9, 9, 'Sales playbook', 'Choose playbook template.', 0, 'closed', 'time', '2026-02-12 17:00:00', 0, '2026-01-28 22:00:57', '2026-01-28 22:59:56', 1),
(10, 10, 'Ops rotation', 'Decide weekly on-call rotation.', 1, 'open', 'all', NULL, 0, '2026-01-28 22:00:57', '2026-01-28 22:00:57', 0),
(11, 1, '11111', 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg', 0, 'open', 'all', NULL, 0, '2026-02-07 15:26:27', '2026-02-07 15:26:27', 1);

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_vote_ballots`
--

CREATE TABLE `project_b_vote_ballots` (
  `id` bigint UNSIGNED NOT NULL,
  `vote_id` bigint UNSIGNED NOT NULL,
  `option_id` bigint UNSIGNED NOT NULL,
  `member_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(21, 10, 20, 11, '2026-01-28 23:00:08'),
(22, 6, 11, 11, '2026-01-28 23:00:19'),
(23, 11, 21, 11, '2026-02-07 15:28:04');

-- --------------------------------------------------------

--
-- 資料表結構 `project_b_vote_options`
--

CREATE TABLE `project_b_vote_options` (
  `id` bigint UNSIGNED NOT NULL,
  `vote_id` bigint UNSIGNED NOT NULL,
  `label` varchar(128) NOT NULL,
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 傾印資料表的資料 `project_b_vote_options`
--

INSERT INTO `project_b_vote_options` (`id`, `vote_id`, `label`, `sort_order`, `created_at`) VALUES
(1, 1, 'Aquila', 1, '2026-01-28 22:00:57'),
(2, 1, 'Orion', 2, '2026-01-28 22:00:57'),
(3, 2, 'Window side', 1, '2026-01-28 22:00:57'),
(4, 2, 'Collaboration zone', 2, '2026-01-28 22:00:57'),
(5, 3, 'Okinawa', 1, '2026-01-28 22:00:57'),
(6, 3, 'Seoul', 2, '2026-01-28 22:00:57'),
(7, 4, 'Jira', 1, '2026-01-28 22:00:57'),
(8, 4, 'Linear', 2, '2026-01-28 22:00:57'),
(9, 5, 'Fixed stipend', 1, '2026-01-28 22:00:57'),
(10, 5, 'Flexible stipend', 2, '2026-01-28 22:00:57'),
(11, 6, 'Frontend performance', 1, '2026-01-28 22:00:57'),
(12, 6, 'Backend reliability', 2, '2026-01-28 22:00:57'),
(13, 7, 'Checklist v1', 1, '2026-01-28 22:00:57'),
(14, 7, 'Checklist v2', 2, '2026-01-28 22:00:57'),
(15, 8, 'Expensify', 1, '2026-01-28 22:00:57'),
(16, 8, 'Zoho Expense', 2, '2026-01-28 22:00:57'),
(17, 9, 'Template A', 1, '2026-01-28 22:00:57'),
(18, 9, 'Template B', 2, '2026-01-28 22:00:57'),
(19, 10, 'Rotation A', 1, '2026-01-28 22:00:57'),
(20, 10, 'Rotation B', 2, '2026-01-28 22:00:57'),
(21, 11, '選項 1', 1, '2026-02-07 15:26:27'),
(22, 11, '選項 2', 2, '2026-02-07 15:26:27');

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `tenant_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '世界 / 專案識別，用於 world rebuild',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登入帳號（tenant scope）',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密碼（可暫時明文或簡單 hash）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1=active, 0=disabled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `username`, `password`, `status`, `created_at`) VALUES
(1, 'project_a', 'admin', '1234', 1, '2026-01-25 22:37:18'),
(2, 'project_a', 'tester', '1234', 1, '2026-01-25 22:37:18'),
(3, 'project_a', 'a_owner', '1234', 1, '2026-01-25 22:37:18'),
(4, 'project_a', 'a_manager', '1234', 1, '2026-01-25 22:37:18'),
(5, 'project_a', 'a_staff', '1234', 1, '2026-01-25 22:37:18'),
(6, 'project_a', 'a_support', '1234', 1, '2026-01-25 22:37:18'),
(7, 'project_a', 'a_viewer', '1234', 1, '2026-01-25 22:37:18'),
(8, 'project_a', 'a_disabled', '1234', 0, '2026-01-25 22:37:18'),
(9, 'project_a', 'a_guest', '1234', 0, '2026-01-25 22:37:18'),
(10, 'project_a', 'a_qa', '1234', 1, '2026-01-25 22:37:18'),
(11, 'project_b', 'admin', '5678', 1, '2026-01-25 22:37:18'),
(12, 'project_b', 'tester', '5678', 0, '2026-01-25 22:37:18'),
(13, 'project_b', 'b_owner', '5678', 1, '2026-01-25 22:37:18'),
(14, 'project_b', 'b_manager', '5678', 1, '2026-01-25 22:37:18'),
(15, 'project_b', 'b_staff', '5678', 1, '2026-01-25 22:37:18'),
(16, 'project_b', 'b_support', '5678', 1, '2026-01-25 22:37:18'),
(17, 'project_b', 'b_viewer', '5678', 1, '2026-01-25 22:37:18'),
(18, 'project_b', 'b_disabled', '5678', 0, '2026-01-25 22:37:18'),
(19, 'project_b', 'b_guest', '5678', 1, '2026-01-25 22:37:18'),
(20, 'project_b', 'b_ops', '5678', 1, '2026-01-25 22:37:18'),
(21, 'flowCenter', 'fc_manager_a', 'flow1234', 1, '2026-03-02 21:33:03'),
(22, 'flowCenter', 'fc_employee_a', 'flow1234', 1, '2026-03-02 21:33:03'),
(23, 'flowCenter', 'fc_employee_a2', 'flow1234', 1, '2026-03-02 21:33:03'),
(24, 'flowCenter', 'fc_employee_a3', 'flow1234', 1, '2026-03-02 21:33:03'),
(25, 'flowCenter', 'fc_employee_a4', 'flow1234', 1, '2026-03-02 21:33:03'),
(26, 'flowCenter', 'fc_manager_b', 'flow1234', 1, '2026-03-02 21:33:03'),
(27, 'flowCenter', 'fc_employee_b', 'flow1234', 1, '2026-03-02 21:33:03'),
(28, 'flowCenter', 'fc_employee_b2', 'flow1234', 1, '2026-03-02 21:33:03'),
(29, 'flowCenter', 'fc_employee_b3', 'flow1234', 1, '2026-03-02 21:33:03'),
(30, 'flowCenter', 'fc_employee_b4', 'flow1234', 1, '2026-03-02 21:33:03'),
(31, 'dineCore', 'manager', 'manager123', 1, '2026-03-03 23:12:31'),
(32, 'dineCore', 'deputy', 'deputy123', 1, '2026-03-03 23:12:31'),
(33, 'dineCore', 'counter', 'counter123', 1, '2026-03-03 23:12:31'),
(34, 'dineCore', 'kitchen', 'kitchen123', 1, '2026-03-03 23:12:31');

-- --------------------------------------------------------

--
-- 資料表結構 `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `token` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `user_tokens`
--

INSERT INTO `user_tokens` (`id`, `user_id`, `token`, `revoked_at`, `created_at`) VALUES
(1, 1, '8effcd209150e7b9197e844383a9b82f19fed50f7a85bab16b80942700901c72', NULL, '2026-01-25 22:49:18'),
(2, 2, 'b797b4b3ccee0918b93f09c4db33a609a87c17e29a6da8f083b59b256b05e8a2', NULL, '2026-01-25 22:50:05'),
(3, 1, 'bf9bb423483e8266bbea459c87a7ae9cfb705d66da7af26f8bb96caa1f8f8100', NULL, '2026-01-25 22:54:33'),
(4, 11, 'fc576a8c9eabfb1589e4d9212018fd6e8168be563218ae690ad76b927d2c5fea', NULL, '2026-01-28 20:16:05'),
(5, 11, 'fd83e9b5d47a895e001d271f622b7f1ca20eb77918a5c77ac6f6a61e3636e2db', NULL, '2026-01-28 20:17:38'),
(6, 11, 'c6ab3d757bb01660fba12952290039c5447f7c154e8b66e9223377676f1377c7', NULL, '2026-01-28 22:04:17'),
(7, 11, '141700df7cbc945084ed401a25db31ad2bdccf76aa25c218856233716a27c411', NULL, '2026-01-28 22:47:07'),
(8, 1, '53d5c641287d28f62a37b883bba790f47ea3bf0a55602f2c5bb412fbfe07da7f', NULL, '2026-02-01 23:39:48'),
(9, 1, '78d25cc052e4c1bdc137c495dfaef0cce5b155ca48a2ce40e532c824cdbc3e82', NULL, '2026-02-01 23:41:06'),
(10, 11, 'a2abba498cce6af16323215e2747b5eeb9afd20d8ed11a04d113c9d099444414', NULL, '2026-02-01 23:45:35'),
(11, 11, '3c561cf8e933eb62a8da1f9d10a3121d1e8509998c12ca12b4b7a80352a8d0d2', NULL, '2026-02-01 23:55:42'),
(12, 11, '33bd5a26681c71a8f8ac68a057748cb983823705c5c1548964fc05ba708bdf42', NULL, '2026-02-05 21:40:08'),
(13, 11, '6a99a105f18e056ac2b2d21c58e644100cd7fe654a2b4057992879e5d1c3742d', NULL, '2026-02-05 21:40:32'),
(14, 11, 'c2e807f55760b2661ed29ad2547e2e32640fa7ac3987abad7c79d855a4fc50c8', NULL, '2026-02-05 21:41:03'),
(15, 1, 'f171cea731567670f542ff21841ad5265730e0b995a52b6ba936a1a483fb0c25', NULL, '2026-02-06 21:50:17'),
(16, 1, 'd3b9c0a40379446b8fb2300766b2992d08cc611c594bc4b109c3b3783686e30e', NULL, '2026-02-06 21:56:33'),
(17, 11, '8725148eb14c223216949372f803620d250f1f4bb1b33a431a7bd08ad1c338ec', NULL, '2026-02-06 22:48:33'),
(18, 11, 'f506e2af07a5280ee461f40a25107062a83b070af1be0f676daaf338e350344d', NULL, '2026-02-07 14:35:47'),
(19, 22, '4e81091fe7c3536d3369413ad6c9bd2e7994c3e9ef96c6197797f0d490baf580', NULL, '2026-03-02 21:33:46'),
(20, 22, 'cdeaf58dab2caeb7a6b1d16ba4d5a44735de535daaa63d527dcf7ad34de6c13c', NULL, '2026-03-02 21:34:03'),
(21, 22, '28ff57f6ae933574d36f6969dc4f76b19202ef4b833c0a932fafd583ce224700', NULL, '2026-03-02 21:35:06'),
(22, 22, 'd6be4e9493de97eda49516bc824b85142d4d51482a01955d41a348532dc99b1b', NULL, '2026-03-02 21:36:34'),
(23, 22, 'b53b5971b74d75b0c96ac9043d8192b17c0d75afec6bc4422b6569346d22122c', NULL, '2026-03-02 21:40:00'),
(24, 21, '86006136e24b0761a81dc12f5a709274a6d47628cde7e0451a8e51e74b045aa7', NULL, '2026-03-02 21:40:22'),
(25, 22, '407cba7daeda98662fc5e900c97f7a0b0b93968f568400df3600d7c9bc0db281', NULL, '2026-03-02 21:40:27'),
(26, 22, 'bc3f30508d64c5e985fe922e776622c725ec5ee4b0491b39f6929ac75c1cc6bf', NULL, '2026-03-02 21:40:36'),
(27, 22, '1c5d6b295ad98a658089f77cab27cba92813237a5ce0bb6be1822dc82d331e4b', NULL, '2026-03-02 21:40:53'),
(28, 22, '0a5c04fb4b3b6faa50a83b30c549154f87709a3a39546985419ff70c88bb621d', NULL, '2026-03-02 21:40:54'),
(29, 22, 'b6212de0ce36f3617c1633a8538248948bf7f6e60a8803269a705d1931e5bfe6', NULL, '2026-03-02 21:40:59'),
(30, 22, 'aeaedd46a298e53dfe74df4ce25712f2785f4d3a412feaca9e963b1d0d690740', NULL, '2026-03-02 21:41:28'),
(31, 22, 'f31adefe55becff0c56a5790f745f37b7269beb098be85028306bfcc514ad867', NULL, '2026-03-02 21:42:06'),
(32, 22, '6772f3336a18cce654062a78a6facd15a051409d345324c035bf7bb9aa7e46ac', NULL, '2026-03-02 21:43:56'),
(33, 22, '9556cd5b2e099abd381ba5e88ceb5ca705f529094b84f9ccc1816c8cabf98570', NULL, '2026-03-02 21:44:02'),
(34, 22, '01078457f090b285b5b400f1c0704624adda92c707dafeaa0825a561af609e42', NULL, '2026-03-02 21:44:23'),
(35, 22, '6ced1c69dfed75ce5e47e92985f061068447d7c23a7164a350f94689fad0e495', NULL, '2026-03-02 21:45:44'),
(36, 22, 'aa2716b6cb8ff81d6c89ecbf3680928aa35bfe64a39d6a380cd7cbd26ccfa224', NULL, '2026-03-02 21:46:11'),
(37, 22, '3cf09137ee58a692020f0532dfa91a9cc0dddaaab7041a42110ea0d8d8799d93', NULL, '2026-03-02 21:46:53'),
(38, 22, '308b34e6ddb9760f5a6d47c4f55dc6cee96beadc3e3db70e255234dd7784d560', NULL, '2026-03-02 21:47:38'),
(39, 22, '658c410077f560717184a691730a37d9d611f97d3fdccef6e92b8cf099ea623c', NULL, '2026-03-02 21:47:55'),
(40, 22, 'd3391c2d11aceb233c583a24992fbd25ddc7c89286fd5920944ed8c92bd64e2f', NULL, '2026-03-02 21:48:44'),
(41, 22, 'ca95285a18152d2fed840190e7e4e48fa40c27927fb8ad42cf3738dd786f4988', NULL, '2026-03-02 21:48:50'),
(42, 22, 'e8f90769951d1f575130b5491dbdf0d0de72b46686b081df5cb084597930f480', NULL, '2026-03-02 21:49:58'),
(43, 22, '8083a4a4ffc2f2374ba670a0fbe002e31a60e3cbf68ecc3d9bc8e12fefe4772c', NULL, '2026-03-02 21:51:18'),
(44, 22, '33962368108139e029afad965b86a278f195b0d764d1d976a57ab594316a8c37', NULL, '2026-03-02 21:51:31'),
(45, 22, '3cfda2faa20ee924b750165ed231cccc8171e25dc911070de5633349613e518c', NULL, '2026-03-02 21:51:44'),
(46, 22, '1bf49d76fef53448a276b0b05944430c35b1e3ca5e712d7a4d3d685193b2bf15', NULL, '2026-03-02 21:56:08'),
(47, 22, 'f54c80f435e34b3c30a23a493740d5d54477886d7b011606de37eef70a51a9da', NULL, '2026-03-02 21:56:21'),
(48, 22, '37ad14419d2f1e122ef710f84e8a76618dac16a420cb2a7158a0c95c9f8ff5bd', NULL, '2026-03-02 21:57:05'),
(49, 22, '8e1481adb79ab558aec754fc516f9725a6410bc9ab94b39b6431f07235841350', NULL, '2026-03-02 21:58:19'),
(50, 22, '15cf55126cbffed04c4728d360ae3c43372318098ce836f33898827a9cecaa4c', NULL, '2026-03-02 21:58:27'),
(51, 22, 'a57060a2c1a450a6518915ffbf01c555e3c5aae2a3f057e6d777f577f142ec07', NULL, '2026-03-02 21:58:37'),
(52, 22, '13502dc0fa22687298e0f15398639d982536694d9135ae8c02dcfb5a48b57d0a', NULL, '2026-03-02 21:58:43'),
(53, 22, 'beec65b9db5f1c7559f91e49be7b9b0ff5b3383eba8192b2c08a7ee27b9af225', NULL, '2026-03-02 21:59:10'),
(54, 22, '927689064e7fe415625ffb337be9303b84a5849148b9e5c7518eda9eccf87542', NULL, '2026-03-02 21:59:28'),
(55, 22, '2fb513ca5a37fd305b3c705c657192c72dd32548b22376cffb713f97f77a3bec', NULL, '2026-03-02 22:03:08'),
(56, 22, '715b5a8adf9305850ec19badbc112521f4b1854fc497ba08f0762f997ee28a91', NULL, '2026-03-02 22:03:25'),
(57, 22, '4319e2664408322588285ad28bfb6fa30eaf0ad2d33816bbc38e69d077d45802', NULL, '2026-03-02 22:37:24'),
(58, 22, 'b3ad8721c2555751d48b881bdf09a253c84f29086a8a69f85ac82be53460c26e', NULL, '2026-03-02 22:39:19'),
(59, 31, '17d1671bad2e89908cb27429c411e3618cfd2cf2e94e450a7bd7f26fac3a2953', NULL, '2026-03-03 23:14:07'),
(60, 31, 'e9288aec29e8dca11f844df755a94721790e6d89aeffd16ebced5a1d2502d2b4', NULL, '2026-03-03 23:14:56'),
(61, 31, '95dbac8248796e12675793fc18d2c043eb0768a1c4a0778e3c6e96276534dc67', NULL, '2026-03-03 23:17:09'),
(62, 31, '8ae15d2d4cb386b61bd31995308a409e89da58ee67678fc24d51acd7d6555309', NULL, '2026-03-03 23:17:46'),
(63, 31, '8b60f83fc22ec48c2a935d60e6fe683303773b27b41f12f4748472c820f4e968', NULL, '2026-03-03 23:18:27'),
(64, 31, '0f2a0d5bef991bd54078717044fe17636e8158424a323c7d30a544f7af106d78', NULL, '2026-03-04 19:18:15'),
(65, 31, 'd2c5a712f5ea93e433975462f752c912a7e8e12f901cdbe4359a28ebd3b3b0d8', NULL, '2026-03-04 19:21:02'),
(66, 31, '2ffb1f1c37e06319c5ad118c3a86015459e324f501db862579c86fdc0708583b', NULL, '2026-03-04 19:21:16'),
(67, 31, '6df7bafdc8a81d18e83b582fd7bc75d98c083386301290e701e23207c8d5c328', NULL, '2026-03-05 20:23:57'),
(68, 31, '175a66c742723dcaecfc5b7b1c00e624d84a4837a0ad5866ad7f3edcad94978f', NULL, '2026-03-05 20:23:59'),
(69, 31, '4c143302b563d6b474caa15e4949a2f5b2a6279821ab79c9474d02d02f793c60', NULL, '2026-03-05 20:24:01'),
(70, 31, '6887156d7671cf2ad132846b5e0897dd701d509a3d22414de7245c3d448be539', NULL, '2026-03-05 20:24:05'),
(71, 31, 'f6ac8fa118fe372e59fdb305d07468a65fa2b95721f9cf8ee8d72c02931aa404', NULL, '2026-03-05 20:24:51'),
(72, 31, 'ac2d8e434f8c884b245081678f24e10da8bde39fe09dafdbfca05394cba5d685', NULL, '2026-03-05 20:25:04'),
(73, 31, '293fbbcbf8d9cb7c33306cf99bf6549f2a17bfaed21723f7e9e1737496fa7895', NULL, '2026-03-05 20:25:56'),
(74, 31, '735d246ce9493ea499ccbaa2a37371a425f482dd80dfd432cf44a98faca5cb8a', NULL, '2026-03-05 20:27:20'),
(75, 31, '736ab23d55e9cf376006daf8722bd76cd068155d88356988e84dbd43f741d634', NULL, '2026-03-05 20:27:25'),
(76, 31, 'a304b037238b563045f59ac2b28d43971517bddd5271c9bea5dc62cd4b1748b7', NULL, '2026-03-05 20:27:41'),
(77, 31, '93a9ce57ce5f58c3adb9edce9f643efb660436b0bcc60251b16cbe2f5b471992', NULL, '2026-03-05 20:29:02'),
(78, 31, '23931f248fead1c5d2b6ee91da598481e0034ddb14b6a2c93b56ece87e4430bc', NULL, '2026-03-05 20:29:45'),
(79, 31, 'cde57a6d2ae49458a2b707ad035d1de3391e2ddf67b9733d88457cb6e55f36b8', NULL, '2026-03-05 20:31:09'),
(80, 32, '38c608d7136d3f1be6a53f0b376db674d0d2d0493490362fdcd4df4764b93c32', NULL, '2026-03-05 20:31:10'),
(81, 33, 'aa7307a2c69aa2b89f2c7c315f59bffa036b417821777d4bde71818fca486bf5', NULL, '2026-03-05 20:31:10'),
(82, 34, 'b827946e62f80a2e80342650fa859be46d90b9f1340024ddccdbacc116f9a271', NULL, '2026-03-05 20:31:10'),
(83, 31, '26c2a93806240d2129aa69cdd1c19f04fea4bc22d26c02c0f7319e109e49852f', NULL, '2026-03-05 20:31:31'),
(84, 31, '151658c759eef881b60f5f8aaf6c930b2d8b6c8fc617388d81d859d8988a7d41', NULL, '2026-03-05 20:32:41'),
(85, 31, '1d3db93ac1375220ed3a8e16c8e691c333085ae24f60957c0df25c8114e416b9', NULL, '2026-03-05 20:33:22'),
(86, 31, '66ee11aa34f46dd2efd336afc125806e508b88c41640fb95fd86babd9757a94a', NULL, '2026-03-05 20:33:27'),
(87, 31, '88ac2947c22bacb2beac966f9243d975e98a8e7e96d18ae2228c2ee2ff32586a', NULL, '2026-03-05 20:37:04'),
(88, 31, '1de27c5c5932a702c8acd131453eaa15d46f51299683965f60eb41df7dda11ae', NULL, '2026-03-06 19:47:34'),
(89, 31, '614bef588c3187defa530c72177244799287f5b3610fe0810f4897542e1cde44', NULL, '2026-03-09 19:02:05'),
(90, 31, 'f3629d963af7bd3c1d40af5ee3d09a71d91fe5996a696b4abde0ad84949e95a6', NULL, '2026-03-09 19:03:38'),
(91, 31, '8610bc70ef3e125faaa2e6d5f61843015352c1e0c58f4d3f9e656cbad4ff3100', NULL, '2026-03-09 19:04:16'),
(92, 31, 'a55751c75949065b45c77c7f40cab2d184f6a75544ac4faebfcea6d9c3190cb1', NULL, '2026-03-09 19:06:07');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `dinecore_business_closings`
--
ALTER TABLE `dinecore_business_closings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `business_date` (`business_date`),
  ADD KEY `fk_dinecore_business_closings_closed_by` (`closed_by_user_id`),
  ADD KEY `fk_dinecore_business_closings_unlocked_by` (`unlocked_by_user_id`);

--
-- 資料表索引 `dinecore_business_closing_history`
--
ALTER TABLE `dinecore_business_closing_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dinecore_business_closing_history_date` (`business_date`),
  ADD KEY `fk_dinecore_business_closing_history_actor` (`actor_user_id`);

--
-- 資料表索引 `dinecore_cart_items`
--
ALTER TABLE `dinecore_cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dinecore_cart_items_order_cart` (`order_id`,`cart_id`),
  ADD KEY `fk_dinecore_cart_items_table` (`table_code`),
  ADD KEY `fk_dinecore_cart_items_menu_item` (`menu_item_id`),
  ADD KEY `idx_dinecore_cart_items_batch_cart` (`batch_id`,`cart_id`);

--
-- 資料表索引 `dinecore_checkout_submissions`
--
ALTER TABLE `dinecore_checkout_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_dinecore_checkout_submissions_session_client` (`session_token`,`client_submission_id`),
  ADD KEY `idx_dinecore_checkout_submissions_table` (`table_code`,`created_at`),
  ADD KEY `fk_dinecore_checkout_submissions_order` (`order_id`),
  ADD KEY `fk_dinecore_checkout_submissions_batch` (`submitted_batch_id`);

--
-- 資料表索引 `dinecore_guest_sessions`
--
ALTER TABLE `dinecore_guest_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `idx_dinecore_guest_sessions_order` (`order_id`),
  ADD KEY `idx_dinecore_guest_sessions_table` (`table_code`);

--
-- 資料表索引 `dinecore_housekeeping_jobs`
--
ALTER TABLE `dinecore_housekeeping_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_key` (`job_key`);

--
-- 資料表索引 `dinecore_menu_categories`
--
ALTER TABLE `dinecore_menu_categories`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `dinecore_menu_items`
--
ALTER TABLE `dinecore_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dinecore_menu_items_category` (`category_id`);

--
-- 資料表索引 `dinecore_orders`
--
ALTER TABLE `dinecore_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_no` (`order_no`),
  ADD KEY `idx_dinecore_orders_table_code` (`table_code`);

--
-- 資料表索引 `dinecore_order_batches`
--
ALTER TABLE `dinecore_order_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_dinecore_order_batches_order_batch_no` (`order_id`,`batch_no`),
  ADD KEY `idx_dinecore_order_batches_order_status` (`order_id`,`status`);

--
-- 資料表索引 `dinecore_order_merge_records`
--
ALTER TABLE `dinecore_order_merge_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_dinecore_order_merge_records_pair` (`target_order_id`,`merged_order_id`),
  ADD KEY `idx_dinecore_order_merge_records_table` (`table_code`,`created_at`),
  ADD KEY `fk_dinecore_order_merge_merged` (`merged_order_id`),
  ADD KEY `fk_dinecore_order_merge_user` (`merged_by_user_id`);

--
-- 資料表索引 `dinecore_order_timeline`
--
ALTER TABLE `dinecore_order_timeline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dinecore_order_timeline_order` (`order_id`);

--
-- 資料表索引 `dinecore_staff_profiles`
--
ALTER TABLE `dinecore_staff_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- 資料表索引 `dinecore_tables`
--
ALTER TABLE `dinecore_tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- 資料表索引 `dinecore_table_sessions`
--
ALTER TABLE `dinecore_table_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_dinecore_table_sessions_table_code` (`table_code`),
  ADD KEY `idx_dinecore_table_sessions_order_id` (`order_id`),
  ADD KEY `idx_dinecore_table_sessions_status` (`status`),
  ADD KEY `idx_dinecore_table_sessions_table_status` (`table_code`,`status`,`id`);

--
-- 資料表索引 `flowcenter_announcements`
--
ALTER TABLE `flowcenter_announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flowcenter_announcements_company` (`company_id`),
  ADD KEY `idx_flowcenter_announcements_published` (`company_id`,`published_at`);

--
-- 資料表索引 `flowcenter_approvals`
--
ALTER TABLE `flowcenter_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flowcenter_approvals_company_source` (`company_id`,`source_type`,`source_id`),
  ADD KEY `idx_flowcenter_approvals_company_approver` (`company_id`,`approver_user_id`);

--
-- 資料表索引 `flowcenter_leave_requests`
--
ALTER TABLE `flowcenter_leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flowcenter_leave_company_user` (`company_id`,`user_id`),
  ADD KEY `idx_flowcenter_leave_company_status` (`company_id`,`status`);

--
-- 資料表索引 `flowcenter_purchase_requests`
--
ALTER TABLE `flowcenter_purchase_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flowcenter_purchase_company_user` (`company_id`,`user_id`),
  ADD KEY `idx_flowcenter_purchase_company_status` (`company_id`,`status`);

--
-- 資料表索引 `flowcenter_tasks`
--
ALTER TABLE `flowcenter_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flowcenter_tasks_company` (`company_id`),
  ADD KEY `idx_flowcenter_tasks_company_assignee` (`company_id`,`assignee_user_id`);

--
-- 資料表索引 `flowcenter_user_profiles`
--
ALTER TABLE `flowcenter_user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_flowcenter_profile_user` (`user_id`),
  ADD KEY `idx_flowcenter_profile_company_role` (`company_id`,`role`),
  ADD KEY `idx_flowcenter_profile_status` (`status`);

--
-- 資料表索引 `project_b_employees`
--
ALTER TABLE `project_b_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_employee_member_email` (`member_id`,`email`),
  ADD KEY `idx_employee_member_id` (`member_id`),
  ADD KEY `idx_employee_status` (`status`),
  ADD KEY `idx_employee_user_id` (`user_id`);

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
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_tenant_username` (`tenant_id`,`username`),
  ADD KEY `idx_tenant` (`tenant_id`);

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
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_business_closings`
--
ALTER TABLE `dinecore_business_closings`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_business_closing_history`
--
ALTER TABLE `dinecore_business_closing_history`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_cart_items`
--
ALTER TABLE `dinecore_cart_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_checkout_submissions`
--
ALTER TABLE `dinecore_checkout_submissions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_guest_sessions`
--
ALTER TABLE `dinecore_guest_sessions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_housekeeping_jobs`
--
ALTER TABLE `dinecore_housekeeping_jobs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_orders`
--
ALTER TABLE `dinecore_orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_order_batches`
--
ALTER TABLE `dinecore_order_batches`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_order_merge_records`
--
ALTER TABLE `dinecore_order_merge_records`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_order_timeline`
--
ALTER TABLE `dinecore_order_timeline`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_staff_profiles`
--
ALTER TABLE `dinecore_staff_profiles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_tables`
--
ALTER TABLE `dinecore_tables`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `dinecore_table_sessions`
--
ALTER TABLE `dinecore_table_sessions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_announcements`
--
ALTER TABLE `flowcenter_announcements`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_approvals`
--
ALTER TABLE `flowcenter_approvals`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_leave_requests`
--
ALTER TABLE `flowcenter_leave_requests`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_purchase_requests`
--
ALTER TABLE `flowcenter_purchase_requests`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_tasks`
--
ALTER TABLE `flowcenter_tasks`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `flowcenter_user_profiles`
--
ALTER TABLE `flowcenter_user_profiles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_employees`
--
ALTER TABLE `project_b_employees`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_notifications`
--
ALTER TABLE `project_b_notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_tasks`
--
ALTER TABLE `project_b_tasks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_task_events`
--
ALTER TABLE `project_b_task_events`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_task_members`
--
ALTER TABLE `project_b_task_members`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_votes`
--
ALTER TABLE `project_b_votes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_vote_ballots`
--
ALTER TABLE `project_b_vote_ballots`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `project_b_vote_options`
--
ALTER TABLE `project_b_vote_options`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `dinecore_business_closings`
--
ALTER TABLE `dinecore_business_closings`
  ADD CONSTRAINT `fk_dinecore_business_closings_closed_by` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_business_closings_unlocked_by` FOREIGN KEY (`unlocked_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_business_closing_history`
--
ALTER TABLE `dinecore_business_closing_history`
  ADD CONSTRAINT `fk_dinecore_business_closing_history_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_cart_items`
--
ALTER TABLE `dinecore_cart_items`
  ADD CONSTRAINT `fk_dinecore_cart_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `dinecore_order_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_cart_items_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `dinecore_menu_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_cart_items_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_cart_items_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_checkout_submissions`
--
ALTER TABLE `dinecore_checkout_submissions`
  ADD CONSTRAINT `fk_dinecore_checkout_submissions_batch` FOREIGN KEY (`submitted_batch_id`) REFERENCES `dinecore_order_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_checkout_submissions_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_checkout_submissions_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_guest_sessions`
--
ALTER TABLE `dinecore_guest_sessions`
  ADD CONSTRAINT `fk_dinecore_guest_sessions_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_guest_sessions_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_menu_items`
--
ALTER TABLE `dinecore_menu_items`
  ADD CONSTRAINT `fk_dinecore_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `dinecore_menu_categories` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_orders`
--
ALTER TABLE `dinecore_orders`
  ADD CONSTRAINT `fk_dinecore_orders_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_order_batches`
--
ALTER TABLE `dinecore_order_batches`
  ADD CONSTRAINT `fk_dinecore_order_batches_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_order_merge_records`
--
ALTER TABLE `dinecore_order_merge_records`
  ADD CONSTRAINT `fk_dinecore_order_merge_merged` FOREIGN KEY (`merged_order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_order_merge_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_order_merge_target` FOREIGN KEY (`target_order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_order_merge_user` FOREIGN KEY (`merged_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_order_timeline`
--
ALTER TABLE `dinecore_order_timeline`
  ADD CONSTRAINT `fk_dinecore_order_timeline_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_staff_profiles`
--
ALTER TABLE `dinecore_staff_profiles`
  ADD CONSTRAINT `fk_dinecore_staff_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `dinecore_table_sessions`
--
ALTER TABLE `dinecore_table_sessions`
  ADD CONSTRAINT `fk_dinecore_table_sessions_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dinecore_table_sessions_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
