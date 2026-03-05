-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: moducore_platform
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dinecore_business_closing_history`
--

DROP TABLE IF EXISTS `dinecore_business_closing_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_business_closing_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `business_date` date NOT NULL,
  `action` varchar(32) NOT NULL,
  `actor_user_id` int(10) unsigned DEFAULT NULL,
  `actor_name` varchar(64) NOT NULL,
  `actor_role` varchar(32) NOT NULL,
  `reason` text DEFAULT NULL,
  `reason_type` varchar(32) NOT NULL DEFAULT 'general',
  `affected_scopes_json` longtext DEFAULT NULL,
  `before_status` varchar(32) NOT NULL DEFAULT '',
  `after_status` varchar(32) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dinecore_business_closing_history_date` (`business_date`),
  KEY `fk_dinecore_business_closing_history_actor` (`actor_user_id`),
  CONSTRAINT `fk_dinecore_business_closing_history_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_business_closing_history`
--

LOCK TABLES `dinecore_business_closing_history` WRITE;
/*!40000 ALTER TABLE `dinecore_business_closing_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `dinecore_business_closing_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_business_closings`
--

DROP TABLE IF EXISTS `dinecore_business_closings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_business_closings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `business_date` date NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'open',
  `closed_at` datetime DEFAULT NULL,
  `closed_by_user_id` int(10) unsigned DEFAULT NULL,
  `close_reason_type` varchar(32) NOT NULL DEFAULT 'daily_close',
  `close_reason` text DEFAULT NULL,
  `unlocked_at` datetime DEFAULT NULL,
  `unlocked_by_user_id` int(10) unsigned DEFAULT NULL,
  `unlock_reason_type` varchar(32) DEFAULT NULL,
  `unlock_reason` text DEFAULT NULL,
  `locked_scopes_json` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `business_date` (`business_date`),
  KEY `fk_dinecore_business_closings_closed_by` (`closed_by_user_id`),
  KEY `fk_dinecore_business_closings_unlocked_by` (`unlocked_by_user_id`),
  CONSTRAINT `fk_dinecore_business_closings_closed_by` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_dinecore_business_closings_unlocked_by` FOREIGN KEY (`unlocked_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_business_closings`
--

LOCK TABLES `dinecore_business_closings` WRITE;
/*!40000 ALTER TABLE `dinecore_business_closings` DISABLE KEYS */;
/*!40000 ALTER TABLE `dinecore_business_closings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_cart_items`
--

DROP TABLE IF EXISTS `dinecore_cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_cart_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `batch_id` int(10) unsigned NOT NULL,
  `table_code` varchar(32) NOT NULL,
  `cart_id` varchar(64) NOT NULL,
  `menu_item_id` varchar(128) NOT NULL,
  `title` varchar(128) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` int(11) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `options_json` longtext DEFAULT NULL,
  `selected_option_ids_json` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dinecore_cart_items_order_cart` (`order_id`,`cart_id`),
  KEY `fk_dinecore_cart_items_table` (`table_code`),
  KEY `fk_dinecore_cart_items_menu_item` (`menu_item_id`),
  KEY `idx_dinecore_cart_items_batch_cart` (`batch_id`,`cart_id`),
  CONSTRAINT `fk_dinecore_cart_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `dinecore_order_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dinecore_cart_items_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `dinecore_menu_items` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_dinecore_cart_items_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dinecore_cart_items_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_cart_items`
--

LOCK TABLES `dinecore_cart_items` WRITE;
/*!40000 ALTER TABLE `dinecore_cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `dinecore_cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_guest_sessions`
--

DROP TABLE IF EXISTS `dinecore_guest_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_guest_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `session_token` varchar(128) NOT NULL,
  `table_code` varchar(32) NOT NULL,
  `order_id` int(10) unsigned NOT NULL,
  `person_slot` int(11) NOT NULL,
  `cart_id` varchar(64) NOT NULL,
  `display_label` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_seen_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_dinecore_guest_sessions_order` (`order_id`),
  KEY `idx_dinecore_guest_sessions_table` (`table_code`),
  CONSTRAINT `fk_dinecore_guest_sessions_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dinecore_guest_sessions_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_guest_sessions`
--

LOCK TABLES `dinecore_guest_sessions` WRITE;
/*!40000 ALTER TABLE `dinecore_guest_sessions` DISABLE KEYS */;
INSERT INTO `dinecore_guest_sessions` VALUES (39,'dcs_dd117ca3724aace3f4d9cdfc0ef429ab','A01',5,1,'guest-1','1號顧客','active','2026-03-04 14:08:39','2026-03-04 16:12:09');
INSERT INTO `dinecore_guest_sessions` VALUES (40,'dcs_7c0d595a1577ae1f3813f03a734bd609','A01',5,2,'guest-2','2號顧客','active','2026-03-04 14:08:45','2026-03-04 15:05:26');
/*!40000 ALTER TABLE `dinecore_guest_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_menu_categories`
--

DROP TABLE IF EXISTS `dinecore_menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_menu_categories` (
  `id` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_menu_categories`
--

LOCK TABLES `dinecore_menu_categories` WRITE;
/*!40000 ALTER TABLE `dinecore_menu_categories` DISABLE KEYS */;
INSERT INTO `dinecore_menu_categories` VALUES ('drink','飲品',30,'2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_categories` VALUES ('main','主餐',20,'2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_categories` VALUES ('new','新品上市',50,'2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_categories` VALUES ('popular','人氣推薦',10,'2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_categories` VALUES ('seasonal','季節限定',40,'2026-03-04 08:39:43','2026-03-04 08:49:57');
/*!40000 ALTER TABLE `dinecore_menu_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_menu_items`
--

DROP TABLE IF EXISTS `dinecore_menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_menu_items` (
  `id` varchar(128) NOT NULL,
  `category_id` varchar(64) NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` text DEFAULT NULL,
  `base_price` int(11) NOT NULL DEFAULT 0,
  `image_url` varchar(255) NOT NULL DEFAULT '',
  `sold_out` tinyint(1) NOT NULL DEFAULT 0,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  `badge` varchar(64) NOT NULL DEFAULT '',
  `tone` varchar(32) NOT NULL DEFAULT '',
  `tags_json` longtext DEFAULT NULL,
  `default_note` text DEFAULT NULL,
  `default_option_ids_json` longtext DEFAULT NULL,
  `option_groups_json` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_dinecore_menu_items_category` (`category_id`),
  CONSTRAINT `fk_dinecore_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `dinecore_menu_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_menu_items`
--

LOCK TABLES `dinecore_menu_items` WRITE;
/*!40000 ALTER TABLE `dinecore_menu_items` DISABLE KEYS */;
INSERT INTO `dinecore_menu_items` VALUES ('chicken-noodle','main','嫩雞胸拌麵','雞胸肉與特製醬汁搭配，份量飽足。',203,'https://picsum.photos/seed/dinecore-chicken-noodle/960/960',0,0,'','sand','[\"主餐\"]','麵加大','[\"chicken-size-large\"]','[{\"id\": \"chicken-size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"chicken-size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"chicken-size-large\", \"label\": \"加大\", \"price_delta\": 20}]}, {\"id\": \"chicken-extra\", \"label\": \"加料\", \"type\": \"multi\", \"required\": false, \"options\": [{\"id\": \"chicken-extra-egg\", \"label\": \"加蛋\", \"price_delta\": 18}, {\"id\": \"chicken-extra-veggie\", \"label\": \"加青菜\", \"price_delta\": 12}]}]','2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_items` VALUES ('seaweed-noodle-signature','seasonal','經典海藻涼麵','海藻麵搭配招牌醬汁與清爽配菜，適合夏季主打。',154,'https://picsum.photos/seed/dinecore-seaweed-signature/960/960',0,0,'人氣推薦','green','[\"招牌\", \"季節限定\"]','不要香菜','[\"size-regular\", \"spice-normal\"]','[{\"id\": \"size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"size-large\", \"label\": \"加大\", \"price_delta\": 20}]}, {\"id\": \"spice\", \"label\": \"辣度\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"spice-mild\", \"label\": \"小辣\", \"price_delta\": 0}, {\"id\": \"spice-normal\", \"label\": \"正常\", \"price_delta\": 0}, {\"id\": \"spice-hot\", \"label\": \"大辣\", \"price_delta\": 10}]}, {\"id\": \"garnish\", \"label\": \"加料\", \"type\": \"multi\", \"required\": false, \"options\": [{\"id\": \"garnish-scallion\", \"label\": \"加蔥\", \"price_delta\": 5}, {\"id\": \"garnish-egg\", \"label\": \"加蛋\", \"price_delta\": 18}]}]','2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_items` VALUES ('seaweed-noodle-single','popular','單點海藻涼麵','單點版本，適合小份量或搭配飲品。',99,'https://picsum.photos/seed/dinecore-seaweed-single/960/960',0,0,'','mint','[\"單點\"]','','[\"single-size-regular\"]','[{\"id\": \"single-size\", \"label\": \"份量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"single-size-regular\", \"label\": \"標準\", \"price_delta\": 0}, {\"id\": \"single-size-large\", \"label\": \"加大\", \"price_delta\": 15}]}]','2026-03-04 08:39:43','2026-03-04 08:49:57');
INSERT INTO `dinecore_menu_items` VALUES ('winter-plum-tea','drink','冬梅冰茶','酸甜清爽，適合搭配涼麵。',45,'https://picsum.photos/seed/dinecore-winter-plum-tea/960/960',0,0,'','amber','[\"飲品\"]','少冰','[\"tea-sugar-half\", \"tea-ice-less\"]','[{\"id\": \"tea-sugar\", \"label\": \"甜度\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"tea-sugar-none\", \"label\": \"無糖\", \"price_delta\": 0}, {\"id\": \"tea-sugar-half\", \"label\": \"半糖\", \"price_delta\": 0}, {\"id\": \"tea-sugar-normal\", \"label\": \"正常\", \"price_delta\": 0}]}, {\"id\": \"tea-ice\", \"label\": \"冰量\", \"type\": \"single\", \"required\": true, \"options\": [{\"id\": \"tea-ice-none\", \"label\": \"去冰\", \"price_delta\": 0}, {\"id\": \"tea-ice-less\", \"label\": \"少冰\", \"price_delta\": 0}, {\"id\": \"tea-ice-normal\", \"label\": \"正常\", \"price_delta\": 0}]}]','2026-03-04 08:39:43','2026-03-04 08:49:57');
/*!40000 ALTER TABLE `dinecore_menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_order_batches`
--

DROP TABLE IF EXISTS `dinecore_order_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_order_batches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `batch_no` int(11) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `source_session_token` varchar(128) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_dinecore_order_batches_order_batch_no` (`order_id`,`batch_no`),
  KEY `idx_dinecore_order_batches_order_status` (`order_id`,`status`),
  CONSTRAINT `fk_dinecore_order_batches_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_order_batches`
--

LOCK TABLES `dinecore_order_batches` WRITE;
/*!40000 ALTER TABLE `dinecore_order_batches` DISABLE KEYS */;
INSERT INTO `dinecore_order_batches` VALUES (10,5,1,'draft',NULL,NULL,NULL,'2026-03-04 14:08:39','2026-03-04 14:08:39');
/*!40000 ALTER TABLE `dinecore_order_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_order_timeline`
--

DROP TABLE IF EXISTS `dinecore_order_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_order_timeline` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `status` varchar(32) NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'system',
  `note` varchar(255) NOT NULL DEFAULT '',
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dinecore_order_timeline_order` (`order_id`),
  CONSTRAINT `fk_dinecore_order_timeline_order` FOREIGN KEY (`order_id`) REFERENCES `dinecore_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_order_timeline`
--

LOCK TABLES `dinecore_order_timeline` WRITE;
/*!40000 ALTER TABLE `dinecore_order_timeline` DISABLE KEYS */;
/*!40000 ALTER TABLE `dinecore_order_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_orders`
--

DROP TABLE IF EXISTS `dinecore_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) NOT NULL,
  `table_code` varchar(32) NOT NULL,
  `order_status` varchar(32) NOT NULL DEFAULT 'draft',
  `payment_status` varchar(32) NOT NULL DEFAULT 'unpaid',
  `payment_method` varchar(32) NOT NULL DEFAULT 'unpaid',
  `estimated_wait_minutes` int(11) DEFAULT NULL,
  `subtotal_amount` int(11) NOT NULL DEFAULT 0,
  `service_fee_amount` int(11) NOT NULL DEFAULT 0,
  `tax_amount` int(11) NOT NULL DEFAULT 0,
  `total_amount` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_dinecore_orders_table_code` (`table_code`),
  CONSTRAINT `fk_dinecore_orders_table` FOREIGN KEY (`table_code`) REFERENCES `dinecore_tables` (`code`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_orders`
--

LOCK TABLES `dinecore_orders` WRITE;
/*!40000 ALTER TABLE `dinecore_orders` DISABLE KEYS */;
INSERT INTO `dinecore_orders` VALUES (5,'DC202603040001','A01','draft','unpaid','unpaid',NULL,0,0,0,0,'2026-03-04 14:08:39','2026-03-04 14:08:39');
/*!40000 ALTER TABLE `dinecore_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_staff_profiles`
--

DROP TABLE IF EXISTS `dinecore_staff_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_staff_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `role` varchar(32) NOT NULL,
  `display_name` varchar(64) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_dinecore_staff_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_staff_profiles`
--

LOCK TABLES `dinecore_staff_profiles` WRITE;
/*!40000 ALTER TABLE `dinecore_staff_profiles` DISABLE KEYS */;
INSERT INTO `dinecore_staff_profiles` VALUES (1,105,'manager','管理者',1,'2026-03-04 08:39:48','2026-03-04 11:08:07');
INSERT INTO `dinecore_staff_profiles` VALUES (2,106,'deputy_manager','副店長',1,'2026-03-04 08:39:48','2026-03-04 11:08:07');
INSERT INTO `dinecore_staff_profiles` VALUES (3,107,'counter','櫃台人員',1,'2026-03-04 08:39:48','2026-03-04 11:08:07');
INSERT INTO `dinecore_staff_profiles` VALUES (4,108,'kitchen','廚房人員',1,'2026-03-04 08:39:48','2026-03-04 11:08:07');
/*!40000 ALTER TABLE `dinecore_staff_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dinecore_tables`
--

DROP TABLE IF EXISTS `dinecore_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dinecore_tables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `area_name` varchar(64) NOT NULL DEFAULT '',
  `dine_mode` varchar(32) NOT NULL DEFAULT 'dine_in',
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `is_ordering_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dinecore_tables`
--

LOCK TABLES `dinecore_tables` WRITE;
/*!40000 ALTER TABLE `dinecore_tables` DISABLE KEYS */;
INSERT INTO `dinecore_tables` VALUES (1,'A01','A01 桌','內用區','dine_in','active',1,1,'2026-03-04 08:39:43','2026-03-04 08:49:57');
/*!40000 ALTER TABLE `dinecore_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_announcements`
--

DROP TABLE IF EXISTS `flowcenter_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_announcements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(64) NOT NULL,
  `author_user_id` int(10) unsigned NOT NULL,
  `title` varchar(180) NOT NULL,
  `content` text NOT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_flowcenter_announcements_company` (`company_id`),
  KEY `idx_flowcenter_announcements_published` (`company_id`,`published_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_announcements`
--

LOCK TABLES `flowcenter_announcements` WRITE;
/*!40000 ALTER TABLE `flowcenter_announcements` DISABLE KEYS */;
INSERT INTO `flowcenter_announcements` VALUES (1,'company-a',101,'??????????','Flow Center ??????????????????????','2026-03-02 16:13:19','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_announcements` VALUES (2,'company-b',103,'company-b ????','company-b ?? dashboard????????????purchase ?????','2026-03-02 16:13:19','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_announcements` VALUES (3,'company-a',101,'三月流程中心上線公告','Flow Center 前後端串接已完成，可開始進行員工與主管測試。','2026-03-02 16:14:00','2026-03-02 16:14:00','2026-03-02 16:14:00');
/*!40000 ALTER TABLE `flowcenter_announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_approvals`
--

DROP TABLE IF EXISTS `flowcenter_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_approvals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(64) NOT NULL,
  `approver_user_id` int(10) unsigned NOT NULL,
  `source_type` varchar(32) NOT NULL,
  `source_id` int(10) unsigned NOT NULL,
  `decision` varchar(32) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_flowcenter_approvals_company_source` (`company_id`,`source_type`,`source_id`),
  KEY `idx_flowcenter_approvals_company_approver` (`company_id`,`approver_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_approvals`
--

LOCK TABLES `flowcenter_approvals` WRITE;
/*!40000 ALTER TABLE `flowcenter_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `flowcenter_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_leave_requests`
--

DROP TABLE IF EXISTS `flowcenter_leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_leave_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(64) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `leave_type` varchar(32) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` decimal(5,2) NOT NULL DEFAULT 1.00,
  `status` varchar(32) NOT NULL DEFAULT 'submitted',
  `reason` text DEFAULT NULL,
  `delegate_name` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_flowcenter_leave_company_user` (`company_id`,`user_id`),
  KEY `idx_flowcenter_leave_company_status` (`company_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_leave_requests`
--

LOCK TABLES `flowcenter_leave_requests` WRITE;
/*!40000 ALTER TABLE `flowcenter_leave_requests` DISABLE KEYS */;
INSERT INTO `flowcenter_leave_requests` VALUES (1,'company-a',102,'annual','2026-03-10','2026-03-11',2.00,'submitted','????????????','?? A','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_leave_requests` VALUES (2,'company-b',104,'sick','2026-03-07','2026-03-07',1.00,'submitted','???????','?? B','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_leave_requests` VALUES (3,'company-a',102,'annual','2026-03-10','2026-03-11',2.00,'submitted','家庭安排，需要請假兩天。','同事 A','2026-03-02 16:14:00','2026-03-02 16:14:00');
/*!40000 ALTER TABLE `flowcenter_leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_purchase_requests`
--

DROP TABLE IF EXISTS `flowcenter_purchase_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_purchase_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(64) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `purpose` text DEFAULT NULL,
  `vendor_name` varchar(150) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'submitted',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_flowcenter_purchase_company_user` (`company_id`,`user_id`),
  KEY `idx_flowcenter_purchase_company_status` (`company_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_purchase_requests`
--

LOCK TABLES `flowcenter_purchase_requests` WRITE;
/*!40000 ALTER TABLE `flowcenter_purchase_requests` DISABLE KEYS */;
INSERT INTO `flowcenter_purchase_requests` VALUES (1,'company-a',102,'??????',28000.00,'?????????','????','submitted','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_purchase_requests` VALUES (2,'company-a',102,'會議室攝影機',28000.00,'補足遠端會議設備。','視訊科技','submitted','2026-03-02 16:14:00','2026-03-02 16:14:00');
/*!40000 ALTER TABLE `flowcenter_purchase_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_tasks`
--

DROP TABLE IF EXISTS `flowcenter_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` varchar(64) NOT NULL,
  `creator_user_id` int(10) unsigned NOT NULL,
  `assignee_user_id` int(10) unsigned DEFAULT NULL,
  `title` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(32) NOT NULL DEFAULT 'medium',
  `status` varchar(32) NOT NULL DEFAULT 'todo',
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_flowcenter_tasks_company` (`company_id`),
  KEY `idx_flowcenter_tasks_company_assignee` (`company_id`,`assignee_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_tasks`
--

LOCK TABLES `flowcenter_tasks` WRITE;
/*!40000 ALTER TABLE `flowcenter_tasks` DISABLE KEYS */;
INSERT INTO `flowcenter_tasks` VALUES (1,'company-a',101,102,'????????','??? employee ????????? manager ?????','high','doing','2026-03-05','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_tasks` VALUES (2,'company-b',103,104,'?? purchase ????','?? company-b ??? purchase ?????? API ?? 404?','medium','todo','2026-03-06','2026-03-02 16:13:19','2026-03-02 16:13:19');
INSERT INTO `flowcenter_tasks` VALUES (3,'company-a',101,102,'確認請假流程欄位','請使用 employee 帳號送出請假，再由 manager 帳號審核。','high','doing','2026-03-05','2026-03-02 16:14:00','2026-03-02 16:14:00');
/*!40000 ALTER TABLE `flowcenter_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flowcenter_user_profiles`
--

DROP TABLE IF EXISTS `flowcenter_user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flowcenter_user_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `company_id` varchar(64) NOT NULL,
  `role` enum('employee','manager') NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_flowcenter_profile_user` (`user_id`),
  KEY `idx_flowcenter_profile_company_role` (`company_id`,`role`),
  KEY `idx_flowcenter_profile_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flowcenter_user_profiles`
--

LOCK TABLES `flowcenter_user_profiles` WRITE;
/*!40000 ALTER TABLE `flowcenter_user_profiles` DISABLE KEYS */;
INSERT INTO `flowcenter_user_profiles` VALUES (1,11,'company-a','manager','????????A',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (2,12,'company-a','employee','???????A1',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (3,13,'company-a','employee','???????A2',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (4,14,'company-a','employee','???????A3',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (5,15,'company-a','employee','???????A4',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (6,16,'company-b','manager','????????B',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (7,17,'company-b','employee','???????B1',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (8,18,'company-b','employee','???????B2',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (9,19,'company-b','employee','???????B3',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (10,20,'company-b','employee','???????B4',1,'2026-03-02 15:59:11','2026-03-02 15:59:11');
INSERT INTO `flowcenter_user_profiles` VALUES (11,101,'company-a','manager','FlowCenter ???? A',1,'2026-03-02 16:01:21','2026-03-02 16:01:21');
INSERT INTO `flowcenter_user_profiles` VALUES (12,102,'company-a','employee','FlowCenter ???? A',1,'2026-03-02 16:01:21','2026-03-02 16:01:21');
INSERT INTO `flowcenter_user_profiles` VALUES (13,103,'company-b','manager','FlowCenter ???? B',1,'2026-03-02 16:01:21','2026-03-02 16:01:21');
INSERT INTO `flowcenter_user_profiles` VALUES (14,104,'company-b','employee','FlowCenter ???? B',1,'2026-03-02 16:01:21','2026-03-02 16:01:21');
/*!40000 ALTER TABLE `flowcenter_user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_employees`
--

DROP TABLE IF EXISTS `project_b_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_employees` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `department` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `role` varchar(32) NOT NULL DEFAULT 'staff',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employee_member_email` (`member_id`,`email`),
  KEY `idx_employee_member_id` (`member_id`),
  KEY `idx_employee_user_id` (`user_id`),
  KEY `idx_employee_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_employees`
--

LOCK TABLES `project_b_employees` WRITE;
/*!40000 ALTER TABLE `project_b_employees` DISABLE KEYS */;
INSERT INTO `project_b_employees` VALUES (1,1,11,'Alex Chen','Engineer','R&D','alex.chen@example.com','0900-000-001','active','super_admin','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (2,2,12,'Bella Lin','Designer','Design','bella.lin@example.com','0900-000-002','active','manager','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (3,3,13,'Chris Wang','Product Manager','Product','chris.wang@example.com','0900-000-003','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (4,4,14,'Diana Lee','Marketing','Marketing','diana.lee@example.com','0900-000-004','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (5,5,15,'Evan Wu','Customer Lead','Support','evan.wu@example.com','0900-000-005','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (6,6,16,'Fiona Kao','HR','HR','fiona.kao@example.com','0900-000-006','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (7,7,17,'Gary Ho','QA','QA','gary.ho@example.com','0900-000-007','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (8,8,18,'Helen Tsai','Finance','Finance','helen.tsai@example.com','0900-000-008','inactive','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (9,9,19,'Ian Huang','Sales','Sales','ian.huang@example.com','0900-000-009','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (10,10,20,'Jane Lu','Ops','Operations','jane.lu@example.com','0900-000-010','active','staff','2026-02-02 23:06:27','2026-02-02 23:06:27');
INSERT INTO `project_b_employees` VALUES (11,11,NULL,'小狗貓','rap','推廣部','111@gmail.com','02333555','active','staff','2026-02-04 19:26:42','2026-02-04 19:26:42');
INSERT INTO `project_b_employees` VALUES (12,12,NULL,'兔利魚','歌手','推廣部','leu@gmail.com','0911123123','active','staff','2026-02-04 19:29:24','2026-02-04 19:29:24');
/*!40000 ALTER TABLE `project_b_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_notifications`
--

DROP TABLE IF EXISTS `project_b_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned NOT NULL,
  `type` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notification_member_id` (`member_id`),
  KEY `idx_notification_is_read` (`is_read`),
  KEY `idx_notification_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_notifications`
--

LOCK TABLES `project_b_notifications` WRITE;
/*!40000 ALTER TABLE `project_b_notifications` DISABLE KEYS */;
INSERT INTO `project_b_notifications` VALUES (1,1,'system','Maintenance notice','System maintenance scheduled at 23:00.',1,'2026-02-04 19:25:23','2026-01-22 18:00:00');
INSERT INTO `project_b_notifications` VALUES (2,2,'task','Task update','Login panel task moved to doing.',1,'2026-01-23 09:10:00','2026-01-23 09:00:00');
INSERT INTO `project_b_notifications` VALUES (3,3,'vote','New vote','Please vote on Q1 project codename.',0,NULL,'2026-01-23 10:00:00');
INSERT INTO `project_b_notifications` VALUES (4,4,'system','Policy update','Remote work policy updated.',1,'2026-01-24 11:20:00','2026-01-24 10:00:00');
INSERT INTO `project_b_notifications` VALUES (5,5,'task','Assignment','You were assigned to support scripts task.',0,NULL,'2026-01-24 14:00:00');
INSERT INTO `project_b_notifications` VALUES (6,6,'system','HR announcement','New benefits enrollment opens next week.',0,NULL,'2026-01-25 09:00:00');
INSERT INTO `project_b_notifications` VALUES (7,7,'task','Regression started','QA regression checklist started.',1,'2026-01-25 10:15:00','2026-01-25 09:30:00');
INSERT INTO `project_b_notifications` VALUES (8,8,'finance','Expense reminder','Please submit January receipts.',0,NULL,'2026-01-26 09:00:00');
INSERT INTO `project_b_notifications` VALUES (9,9,'sales','Pipeline review','Weekly pipeline review at 15:00.',1,'2026-01-26 15:05:00','2026-01-26 14:00:00');
INSERT INTO `project_b_notifications` VALUES (10,10,'ops','Backup check','Backup verification in progress.',0,NULL,'2026-01-26 16:00:00');
INSERT INTO `project_b_notifications` VALUES (11,1,'vote','新增投票','投票「測試新投票派發」已建立',0,NULL,'2026-02-04 19:37:45');
/*!40000 ALTER TABLE `project_b_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_task_events`
--

DROP TABLE IF EXISTS `project_b_task_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_task_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint(20) unsigned NOT NULL,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `event_type` enum('system','note') NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_task_event_task_id` (`task_id`),
  KEY `idx_task_event_member_id` (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_task_events`
--

LOCK TABLES `project_b_task_events` WRITE;
/*!40000 ALTER TABLE `project_b_task_events` DISABLE KEYS */;
INSERT INTO `project_b_task_events` VALUES (1,1,NULL,'system','Task created and assigned.','2026-01-20 09:00:00');
INSERT INTO `project_b_task_events` VALUES (2,1,2,'note','Checklist drafted, waiting for review.','2026-01-21 10:30:00');
INSERT INTO `project_b_task_events` VALUES (3,2,NULL,'system','Status changed to doing.','2026-01-22 09:15:00');
INSERT INTO `project_b_task_events` VALUES (4,2,2,'note','Uploaded first mockups.','2026-01-22 16:40:00');
INSERT INTO `project_b_task_events` VALUES (5,3,NULL,'system','Task created and assigned.','2026-01-23 11:05:00');
INSERT INTO `project_b_task_events` VALUES (6,4,4,'note','Draft outline shared with team.','2026-01-23 17:20:00');
INSERT INTO `project_b_task_events` VALUES (7,5,NULL,'system','Status changed to doing.','2026-01-24 09:10:00');
INSERT INTO `project_b_task_events` VALUES (8,6,6,'note','Policy updated and sent for approval.','2026-01-24 15:00:00');
INSERT INTO `project_b_task_events` VALUES (9,7,NULL,'system','Regression started.','2026-01-25 09:00:00');
INSERT INTO `project_b_task_events` VALUES (10,8,8,'note','Collected receipts from team.','2026-01-25 13:45:00');
INSERT INTO `project_b_task_events` VALUES (11,9,NULL,'system','Task created and assigned.','2026-01-26 09:00:00');
INSERT INTO `project_b_task_events` VALUES (12,10,10,'note','Backup verification in progress.','2026-01-26 16:10:00');
INSERT INTO `project_b_task_events` VALUES (13,10,NULL,'note','測看看','2026-02-03 00:00:14');
INSERT INTO `project_b_task_events` VALUES (14,10,1,'note','可以在側看看','2026-02-04 19:38:04');
/*!40000 ALTER TABLE `project_b_task_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_task_members`
--

DROP TABLE IF EXISTS `project_b_task_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_task_members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint(20) unsigned NOT NULL,
  `member_id` bigint(20) unsigned NOT NULL,
  `role` enum('participant','watcher') NOT NULL DEFAULT 'participant',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_task_member` (`task_id`,`member_id`),
  KEY `idx_task_member_task_id` (`task_id`),
  KEY `idx_task_member_member_id` (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_task_members`
--

LOCK TABLES `project_b_task_members` WRITE;
/*!40000 ALTER TABLE `project_b_task_members` DISABLE KEYS */;
INSERT INTO `project_b_task_members` VALUES (1,1,1,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (2,1,2,'watcher','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (3,2,2,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (4,2,3,'watcher','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (5,3,3,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (6,4,4,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (7,5,5,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (8,6,6,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (9,7,7,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (10,8,8,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (11,9,9,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (12,10,10,'participant','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (13,7,1,'watcher','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (14,5,2,'watcher','2026-02-02 23:06:46');
INSERT INTO `project_b_task_members` VALUES (15,3,4,'watcher','2026-02-02 23:06:46');
/*!40000 ALTER TABLE `project_b_task_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_tasks`
--

DROP TABLE IF EXISTS `project_b_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_tasks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned NOT NULL,
  `publisher_member_id` bigint(20) unsigned NOT NULL,
  `assignee_member_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `status` enum('todo','doing','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_task_member_id` (`member_id`),
  KEY `idx_task_publisher_member_id` (`publisher_member_id`),
  KEY `idx_task_assignee_member_id` (`assignee_member_id`),
  KEY `idx_task_status` (`status`),
  KEY `idx_task_due_date` (`due_date`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_tasks`
--

LOCK TABLES `project_b_tasks` WRITE;
/*!40000 ALTER TABLE `project_b_tasks` DISABLE KEYS */;
INSERT INTO `project_b_tasks` VALUES (1,1,1,2,'Set up onboarding','Prepare onboarding checklist and accounts.','todo','high','2026-02-10','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (2,2,2,3,'Design login panel','Draft UI variants for login panel.','doing','medium','2026-02-05','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (3,3,3,4,'Prepare product brief','Summarize Q1 scope and milestones.','todo','medium','2026-02-12','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (4,4,4,5,'Marketing campaign','Plan February campaign assets.','todo','low','2026-02-20','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (5,5,5,6,'Support scripts','Update support response templates.','doing','medium','2026-02-08','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (6,6,6,7,'HR policy update','Revise remote work policy draft.','done','low','2026-01-31','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (7,7,7,8,'QA regression','Run regression checklist for release.','doing','high','2026-02-03','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (8,8,8,9,'Finance report','Compile monthly expense report.','todo','medium','2026-02-15','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (9,9,9,10,'Sales pipeline','Clean up pipeline and follow-ups.','todo','medium','2026-02-18','2026-02-02 23:06:46','2026-02-02 23:06:46');
INSERT INTO `project_b_tasks` VALUES (10,10,10,1,'Ops checklist','Verify infra and backups.','doing','high','2026-02-06','2026-02-02 23:06:46','2026-02-02 23:06:46');
/*!40000 ALTER TABLE `project_b_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_vote_ballots`
--

DROP TABLE IF EXISTS `project_b_vote_ballots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_vote_ballots` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vote_id` bigint(20) unsigned NOT NULL,
  `option_id` bigint(20) unsigned NOT NULL,
  `member_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_vote_ballot` (`vote_id`,`option_id`,`member_id`),
  KEY `idx_vote_ballot_member_id` (`member_id`),
  KEY `idx_vote_ballot_vote_id` (`vote_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_vote_ballots`
--

LOCK TABLES `project_b_vote_ballots` WRITE;
/*!40000 ALTER TABLE `project_b_vote_ballots` DISABLE KEYS */;
INSERT INTO `project_b_vote_ballots` VALUES (1,1,1,2,'2026-01-22 09:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (2,1,2,3,'2026-01-22 09:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (3,2,3,4,'2026-01-23 10:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (4,2,4,5,'2026-01-23 10:10:00');
INSERT INTO `project_b_vote_ballots` VALUES (5,3,5,6,'2026-01-18 12:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (6,3,6,7,'2026-01-18 12:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (7,4,7,8,'2026-01-24 09:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (8,4,8,9,'2026-01-24 09:10:00');
INSERT INTO `project_b_vote_ballots` VALUES (9,5,9,10,'2026-01-25 11:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (10,5,10,1,'2026-01-25 11:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (11,6,11,2,'2026-01-26 09:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (12,6,12,3,'2026-01-26 09:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (13,7,13,4,'2026-01-14 17:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (14,7,14,5,'2026-01-14 17:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (15,8,15,6,'2026-01-26 10:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (16,8,16,7,'2026-01-26 10:10:00');
INSERT INTO `project_b_vote_ballots` VALUES (17,9,17,8,'2026-01-26 14:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (18,9,18,9,'2026-01-26 14:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (19,10,19,10,'2026-01-26 16:00:00');
INSERT INTO `project_b_vote_ballots` VALUES (20,10,20,1,'2026-01-26 16:05:00');
INSERT INTO `project_b_vote_ballots` VALUES (21,10,20,11,'2026-02-03 00:00:45');
INSERT INTO `project_b_vote_ballots` VALUES (23,9,17,11,'2026-02-03 00:01:00');
INSERT INTO `project_b_vote_ballots` VALUES (26,8,16,11,'2026-02-03 00:01:21');
INSERT INTO `project_b_vote_ballots` VALUES (29,4,8,11,'2026-02-03 00:01:35');
/*!40000 ALTER TABLE `project_b_vote_ballots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_vote_options`
--

DROP TABLE IF EXISTS `project_b_vote_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_vote_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `vote_id` bigint(20) unsigned NOT NULL,
  `label` varchar(128) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_vote_option_vote_id` (`vote_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_vote_options`
--

LOCK TABLES `project_b_vote_options` WRITE;
/*!40000 ALTER TABLE `project_b_vote_options` DISABLE KEYS */;
INSERT INTO `project_b_vote_options` VALUES (1,1,'Aquila',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (2,1,'Orion',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (3,2,'Window side',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (4,2,'Collaboration zone',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (5,3,'Okinawa',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (6,3,'Seoul',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (7,4,'Jira',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (8,4,'Linear',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (9,5,'Fixed stipend',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (10,5,'Flexible stipend',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (11,6,'Frontend performance',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (12,6,'Backend reliability',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (13,7,'Checklist v1',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (14,7,'Checklist v2',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (15,8,'Expensify',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (16,8,'Zoho Expense',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (17,9,'Template A',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (18,9,'Template B',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (19,10,'Rotation A',1,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (20,10,'Rotation B',2,'2026-02-02 23:06:55');
INSERT INTO `project_b_vote_options` VALUES (21,11,'選項 1',1,'2026-02-04 19:31:06');
INSERT INTO `project_b_vote_options` VALUES (22,11,'選項 2',2,'2026-02-04 19:31:06');
INSERT INTO `project_b_vote_options` VALUES (23,12,'選項 1',1,'2026-02-04 19:37:45');
INSERT INTO `project_b_vote_options` VALUES (24,12,'選項 2',2,'2026-02-04 19:37:45');
/*!40000 ALTER TABLE `project_b_vote_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_b_votes`
--

DROP TABLE IF EXISTS `project_b_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_b_votes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` text NOT NULL,
  `allow_multiple` tinyint(1) NOT NULL DEFAULT 0,
  `anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `rule_mode` enum('all','time') NOT NULL DEFAULT 'all',
  `rule_deadline` datetime DEFAULT NULL,
  `rule_total_voters` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_vote_member_id` (`member_id`),
  KEY `idx_vote_status` (`status`),
  KEY `idx_vote_rule_deadline` (`rule_deadline`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_b_votes`
--

LOCK TABLES `project_b_votes` WRITE;
/*!40000 ALTER TABLE `project_b_votes` DISABLE KEYS */;
INSERT INTO `project_b_votes` VALUES (1,1,'Project codename','Choose the Q1 codename.',0,0,'open','all',NULL,10,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (2,2,'Office seating','Preferred seating area.',1,0,'open','time','2026-02-10 18:00:00',0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (3,3,'Team outing','Vote for annual outing location.',1,0,'closed','time','2026-01-20 12:00:00',0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (4,4,'Tooling','Pick a new issue tracker.',0,1,'open','all',NULL,12,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (5,5,'Lunch policy','Choose lunch stipend option.',0,0,'open','time','2026-02-05 12:00:00',0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (6,6,'Training topic','Pick a training topic for February.',1,1,'open','all',NULL,0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (7,7,'QA checklist','Select checklist version to adopt.',0,0,'closed','time','2026-01-15 18:00:00',0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (8,8,'Finance tool','Pick expense tool for Q2.',0,0,'open','all',NULL,8,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (9,9,'Sales playbook','Choose playbook template.',0,1,'open','time','2026-02-12 17:00:00',0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (10,10,'Ops rotation','Decide weekly on-call rotation.',1,0,'open','all',NULL,0,'2026-02-02 23:06:55','2026-02-02 23:06:55');
INSERT INTO `project_b_votes` VALUES (11,1,'測試測試測試測試','測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試',0,0,'open','all',NULL,0,'2026-02-04 19:31:06','2026-02-04 19:31:06');
INSERT INTO `project_b_votes` VALUES (12,1,'測試新投票派發','測試新投票派發測試新投票派發測試新投票派發測試新投票派發測試新投票派發',0,0,'open','all',NULL,0,'2026-02-04 19:37:45','2026-02-04 19:37:45');
/*!40000 ALTER TABLE `project_b_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_tokens`
--

DROP TABLE IF EXISTS `user_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(128) NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_revoked_at` (`revoked_at`)
) ENGINE=MyISAM AUTO_INCREMENT=43 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_tokens`
--

LOCK TABLES `user_tokens` WRITE;
/*!40000 ALTER TABLE `user_tokens` DISABLE KEYS */;
INSERT INTO `user_tokens` VALUES (1,11,'ed3bc8767ef41446e0425535df8165650187715386be340b701d92a23597cd84',NULL,'2026-02-02 23:21:42');
INSERT INTO `user_tokens` VALUES (2,11,'83ef909759a244915da1484a93dfc40deaecd052e180c33961e84125df8b786c',NULL,'2026-02-02 23:40:09');
INSERT INTO `user_tokens` VALUES (3,11,'08f07449ace225c25341dc7fdb523042e3efeb0e3f1469b595c6ed7b999d5a5e',NULL,'2026-02-02 23:59:52');
INSERT INTO `user_tokens` VALUES (4,11,'070d8a2778458346cf2b336a47c976e43a8e135993d5e89d9cd300b0e59c9c0c',NULL,'2026-02-03 00:03:27');
INSERT INTO `user_tokens` VALUES (5,11,'2edd3d60ad4efba526517a7897f71c53daf3042ab628f771aadc2f93731b1435',NULL,'2026-02-03 00:14:48');
INSERT INTO `user_tokens` VALUES (6,11,'83bf2643d7b2441bcf65d6aa66ea14f3e051ec784b53c3695441aae1eaca6fd4',NULL,'2026-02-03 18:07:22');
INSERT INTO `user_tokens` VALUES (7,11,'5dfde84d5ffe73cda71677c8789bf9e2c4cc29b179b2d97a34257b278dc0aea7',NULL,'2026-02-04 17:54:49');
INSERT INTO `user_tokens` VALUES (8,11,'c88ccc03ae6ef7ba2e7f054a6100fc20a09a6bd125ed88f5f11d9f992a846a92',NULL,'2026-02-04 19:30:34');
INSERT INTO `user_tokens` VALUES (9,11,'0750d3ae2adad1ed8d52ffb9c96ac3073f73c8714226dfa6b990af405745e2d9',NULL,'2026-02-04 22:08:18');
INSERT INTO `user_tokens` VALUES (10,11,'ad3b197b382e681b850f4165a30f7db0422b5d65c601980abfd96d6ba3992bcb',NULL,'2026-02-04 22:32:03');
INSERT INTO `user_tokens` VALUES (11,11,'7e940426f9153d736dc5c95abc79acd38f830e9ba722f7d94eaf57b144768d87','2026-02-10 08:44:04','2026-02-09 10:19:35');
INSERT INTO `user_tokens` VALUES (12,11,'63d80d85e8df189448e84c10f86b8b1a266ae6aa504da191d324c83a15f9828c',NULL,'2026-02-10 08:44:06');
INSERT INTO `user_tokens` VALUES (13,11,'e381d271cbb36c1dfbf8e1c2e44ba1335380060d45dc280c96bf6dfe95b49484','2026-02-24 11:15:45','2026-02-11 13:43:41');
INSERT INTO `user_tokens` VALUES (14,11,'d4725d306bd1a69aac5c09790215e6a5b89eb09b99aab48f599caa4f9c494bde','2026-02-24 14:32:33','2026-02-24 11:16:02');
INSERT INTO `user_tokens` VALUES (15,11,'370499610b5543812d7d0bc48f5a64e158fafeeacbd32b47b8052bf557b8f2db',NULL,'2026-02-24 14:32:37');
INSERT INTO `user_tokens` VALUES (16,102,'2df41c7817e25097f7c73b2c9e01657bc1f31c00e1aab0fbc026a9b766f8602b',NULL,'2026-03-02 16:02:45');
INSERT INTO `user_tokens` VALUES (17,102,'c7fa081fdd3b396c2b6e8eb98a73b67fff083834194eddaeab14ec1f7e8b9a7d',NULL,'2026-03-02 16:14:08');
INSERT INTO `user_tokens` VALUES (18,102,'74259694f25496c3319a9c3c34c296ef2fa01bb19ddb1d3d4e06eb1b275e6c7e',NULL,'2026-03-02 16:14:42');
INSERT INTO `user_tokens` VALUES (19,102,'b3a8ceb7a5ff7aa40babf6ca471e18131e8eb3522e4a7696bfb41a00ca0590d6',NULL,'2026-03-02 16:14:47');
INSERT INTO `user_tokens` VALUES (20,102,'533178c40f91d959a28dc98b36bc5cc8e3d076bc6064b606a34c5a5f066bdaf5',NULL,'2026-03-02 16:15:14');
INSERT INTO `user_tokens` VALUES (21,101,'5dcc808f5b3ce2c06a3cf1c7991c0078ecafdf8b61bcf3678c25ca13fbcace5b',NULL,'2026-03-02 16:15:18');
INSERT INTO `user_tokens` VALUES (22,102,'cdddbf3de1554af13819e27b8cc744a34529f6054171ef5b7a91c9ea513a5cbd',NULL,'2026-03-02 16:20:51');
INSERT INTO `user_tokens` VALUES (23,102,'1423680c9223ae093916310efec99ee78619e532e4394c9efd465a94bce8df81',NULL,'2026-03-02 16:21:20');
INSERT INTO `user_tokens` VALUES (24,102,'039ff37d25530042c47a876869bfe7e8ecc875510df186adcb69e7e00c570ecc',NULL,'2026-03-02 16:26:14');
INSERT INTO `user_tokens` VALUES (25,102,'203526c3e90fb4676c4d5c8d62db5d51833a1b91391a8850b77b8e82877ea970',NULL,'2026-03-02 16:26:22');
INSERT INTO `user_tokens` VALUES (26,105,'d9282c4b6faf48e86a6f771b4d6b28b17d817b53c5195060efbb4fb80b6a6658',NULL,'2026-03-04 08:43:21');
INSERT INTO `user_tokens` VALUES (27,105,'7521c3b3768af02347cdbeda3df3349a294d4ca85920a0c930f68f50e45a4287',NULL,'2026-03-04 10:46:11');
INSERT INTO `user_tokens` VALUES (28,107,'06c23e305531816f0abb0256a935a44014ebbca220fb605f759c646b5720ccd0',NULL,'2026-03-04 10:56:19');
INSERT INTO `user_tokens` VALUES (29,107,'92e1fe612fcc043e055eb685fee67cd401f77390afd227757009690da4b19e07',NULL,'2026-03-04 10:56:42');
INSERT INTO `user_tokens` VALUES (30,108,'d3a0a4ca711f681be5d1f8939a497751359bc12848db19b9e3f9473f72b9d484',NULL,'2026-03-04 10:56:42');
INSERT INTO `user_tokens` VALUES (31,107,'e28a4abc90ae3abba9c3ddc8ecba7b9ad8e6df949bc822a35464882aca5f998a',NULL,'2026-03-04 10:58:07');
INSERT INTO `user_tokens` VALUES (32,108,'7e9c6c6f40adeb8aee129cbf25f6e2117a7bfa7ddfc25a3bc0f8d44eef8bddb9',NULL,'2026-03-04 10:58:07');
INSERT INTO `user_tokens` VALUES (33,107,'bdaabc633e7877fa7228486ca04d47db94cc620b9240896c0d87857c684383e6',NULL,'2026-03-04 11:00:46');
INSERT INTO `user_tokens` VALUES (34,108,'bd3219020da65b7fa87d2fb3aab081cb9b8d4f4d906dfa8e7104539e45086d8e',NULL,'2026-03-04 11:00:46');
INSERT INTO `user_tokens` VALUES (35,107,'bb4c29c92455df7d092e7c5332de75e6fc58ea88c5f764062b8fa63b9edb81d0',NULL,'2026-03-04 11:02:10');
INSERT INTO `user_tokens` VALUES (36,105,'58b3f2db840d824a386d1c97351eff25d8379794f6802af2cf48bcf7efd92696',NULL,'2026-03-04 11:29:13');
INSERT INTO `user_tokens` VALUES (37,105,'f06a936dc41feecf9d7249ae8c5a227ecbafee7475d6d9edd0a08334c4e2cc21',NULL,'2026-03-04 11:30:04');
INSERT INTO `user_tokens` VALUES (38,105,'3f457ce1db577a9f5d74543786304a3989e65af172997b218ff96731cd036ed2',NULL,'2026-03-04 11:31:49');
INSERT INTO `user_tokens` VALUES (39,105,'fa63ee2044b649ca4ca09ceab5fb19aa2124fe2fba9d8c26ccd7b3418ef4d385',NULL,'2026-03-04 11:39:25');
INSERT INTO `user_tokens` VALUES (40,105,'8edfa9e110d696c19032e40a50f479fd5a1e904ab68ed059232791425ebf7381',NULL,'2026-03-04 12:20:16');
INSERT INTO `user_tokens` VALUES (41,105,'ee54f40d2581f3e4929216ebb5d80c409304d69561bf7335037e7bdcd39cc694',NULL,'2026-03-04 13:46:33');
INSERT INTO `user_tokens` VALUES (42,105,'7f10d56fc5aa589b91a954db1acb777e805c7ea3a9d3f1119dc45c229a7b9c76',NULL,'2026-03-04 15:06:42');
/*!40000 ALTER TABLE `user_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(50) NOT NULL COMMENT '世界 / 專案識別，用於 world rebuild',
  `username` varchar(50) NOT NULL COMMENT '登入帳號（tenant scope）',
  `password` varchar(255) NOT NULL COMMENT '密碼（可暫時明文或簡單 hash）',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1=active, 0=disabled',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_tenant_username` (`tenant_id`,`username`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'project_a','admin','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (2,'project_a','tester','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (3,'project_a','a_owner','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (4,'project_a','a_manager','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (5,'project_a','a_staff','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (6,'project_a','a_support','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (7,'project_a','a_viewer','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (8,'project_a','a_disabled','1234',0,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (9,'project_a','a_guest','1234',0,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (10,'project_a','a_qa','1234',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (11,'project_b','admin','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (12,'project_b','tester','5678',0,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (13,'project_b','b_owner','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (14,'project_b','b_manager','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (15,'project_b','b_staff','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (16,'project_b','b_support','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (17,'project_b','b_viewer','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (18,'project_b','b_disabled','5678',0,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (19,'project_b','b_guest','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (20,'project_b','b_ops','5678',1,'2026-01-28 10:18:02');
INSERT INTO `users` VALUES (101,'flowCenter','fc_manager_a','flow1234',1,'2026-03-02 16:01:21');
INSERT INTO `users` VALUES (102,'flowCenter','fc_employee_a','flow1234',1,'2026-03-02 16:01:21');
INSERT INTO `users` VALUES (103,'flowCenter','fc_manager_b','flow1234',1,'2026-03-02 16:01:21');
INSERT INTO `users` VALUES (104,'flowCenter','fc_employee_b','flow1234',1,'2026-03-02 16:01:21');
INSERT INTO `users` VALUES (105,'dineCore','manager','manager123',1,'2026-03-04 08:38:40');
INSERT INTO `users` VALUES (106,'dineCore','deputy','deputy123',1,'2026-03-04 08:38:40');
INSERT INTO `users` VALUES (107,'dineCore','counter','counter123',1,'2026-03-04 08:38:40');
INSERT INTO `users` VALUES (108,'dineCore','kitchen','kitchen123',1,'2026-03-04 08:38:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'moducore_platform'
--

--
-- Dumping routines for database 'moducore_platform'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05 11:17:54
