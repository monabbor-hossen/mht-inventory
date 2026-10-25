-- ====================================================================
-- MHT Inventory & Ledger System - MySQL Database Schema
-- Ready for XAMPP (Local) and Hostinger Web Hosting (phpMyAdmin)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('Super Admin', 'Manager', 'Staff') NOT NULL DEFAULT 'Staff',
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `status` ENUM('Active', 'Suspended') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INBOUND BATCHES TABLE
CREATE TABLE IF NOT EXISTS `inbound_batches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_number` VARCHAR(50) NOT NULL UNIQUE,
  `supplier_name` VARCHAR(150) NOT NULL,
  `origin` VARCHAR(50) NOT NULL DEFAULT 'Local',
  `challan_number` VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `bags_count` INT NOT NULL DEFAULT 0,
  `unit_weight` VARCHAR(30) NOT NULL DEFAULT '25 Kg',
  `numeric_kg` DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  `total_tonnes` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `warehouse_zone` VARCHAR(50) NOT NULL DEFAULT 'Zone A',
  `printer_name` VARCHAR(150) DEFAULT NULL,
  `received_by` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  `status` ENUM('Received', 'In Stock', 'Dispatched', 'Damaged') DEFAULT 'Received',
  `received_date` DATE NOT NULL,
  `received_time` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_supplier` (`supplier_name`),
  INDEX `idx_zone` (`warehouse_zone`),
  INDEX `idx_date` (`received_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SCANS & STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS `scans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `scan_key` VARCHAR(50) NOT NULL UNIQUE,
  `batch_number` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `bags` INT NOT NULL DEFAULT 1,
  `unit_weight` VARCHAR(30) NOT NULL DEFAULT '25 Kg',
  `warehouse_zone` VARCHAR(50) NOT NULL DEFAULT 'Zone A',
  `scanned_by` VARCHAR(100) NOT NULL,
  `direction` ENUM('In', 'Out', 'Damaged') NOT NULL,
  `scan_date` VARCHAR(30) NOT NULL,
  `scan_time` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_batch` (`batch_number`),
  INDEX `idx_direction` (`direction`),
  INDEX `idx_scandate` (`scan_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DAMAGES & RETURNS TABLE
CREATE TABLE IF NOT EXISTS `damages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `damage_code` VARCHAR(50) NOT NULL UNIQUE,
  `batch_number` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `bags` INT NOT NULL DEFAULT 1,
  `reason` ENUM('Torn Bag', 'Moisture/Water Damage', 'Weight Shortage', 'Quality Issue') NOT NULL,
  `reported_by` VARCHAR(100) NOT NULL,
  `photo_url` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `damage_date` VARCHAR(30) NOT NULL,
  `damage_time` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_damage_batch` (`batch_number`),
  INDEX `idx_reason` (`reason`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. EXPENSES & FINANCIAL LEDGER TABLE
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `voucher_no` VARCHAR(50) NOT NULL UNIQUE,
  `category` ENUM('Transport & Freight', 'Labor & Wages', 'Office & Warehouse', 'Others') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `expense_date` DATE NOT NULL,
  `expense_time` VARCHAR(20) NOT NULL,
  `note` TEXT NOT NULL,
  `entered_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cat` (`category`),
  INDEX `idx_exp_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. OFFLINE SYNC LOG TABLE
CREATE TABLE IF NOT EXISTS `offline_sync_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_record_id` VARCHAR(50) NOT NULL,
  `record_kind` ENUM('Scan', 'Expense', 'Damage') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `synced_by` VARCHAR(100) DEFAULT 'Staff',
  `synced_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

-- Users: Passwords default to 'mht1500sqft' (Plain/Bcrypt supported by auth handler)
INSERT INTO `users` (`user_id`, `name`, `role`, `password`) VALUES
('MHT-ADMIN-01', 'Mahmudul H. (Super Admin)', 'Super Admin', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
('MHT-MGR-04', 'Kamal H. (Manager)', 'Manager', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
('MHT-OPR-12', 'Rafiqul I. (Staff)', 'Staff', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
('MHT-OPR-15', 'Tanvir A. (Staff)', 'Staff', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Inbound Batches
INSERT INTO `inbound_batches` (`batch_number`, `supplier_name`, `origin`, `challan_number`, `product_name`, `bags_count`, `unit_weight`, `numeric_kg`, `total_tonnes`, `warehouse_zone`, `printer_name`, `received_by`, `status`, `received_date`, `received_time`) VALUES
('B-2610-131', 'Nabil Auto Flour & Rice Mills', 'Local', 'LC-DHK-2026-8841', 'Miniket Premium 25 Kg', 450, '25 Kg', 25.00, 11.25, 'Zone A', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Received', CURDATE(), '10:42'),
('B-2610-130', 'Rashid Agro Food Products Ltd.', 'Local', 'LC-DHK-2026-8840', 'Basmati Royal 25 Kg', 300, '25 Kg', 25.00, 7.50, 'Zone B', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Received', CURDATE(), '10:39'),
('B-2610-128', 'Nabil Auto Flour & Rice Mills', 'Local', 'CHL-9021', 'Nazirshail Special 50 Kg', 600, '50 Kg', 50.00, 30.00, 'Floor-1', 'TSC TE244 via USB', 'Mahmudul H. (Super Admin)', 'Received', CURDATE(), '10:31'),
('B-2610-124', 'Al-Haramain Gulf Commodities (UAE)', 'Middle East', 'LC-CTG-2026-1102', 'Kataribhog Aromatic 25 Kg', 200, '25 Kg', 25.00, 5.00, 'Zone A', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Received', CURDATE(), '10:18'),
('B-2610-120', 'TK Group Commodity Division', 'Middle East', 'LC-CTG-2026-1099', 'Gulf Parboiled 50 Kg', 500, '50 Kg', 50.00, 25.00, 'Floor-2', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Received', CURDATE(), '09:57'),
('B-2610-118', 'Akij Essential Grains Ltd.', 'Local', 'CHL-8977', 'Miniket Premium 25 Kg', 800, '25 Kg', 25.00, 20.00, 'Zone A', 'TSC TE244 via USB', 'Mahmudul H. (Super Admin)', 'Received', CURDATE(), '09:20')
ON DUPLICATE KEY UPDATE `supplier_name`=VALUES(`supplier_name`);

-- Scans (In / Out / Damaged)
INSERT INTO `scans` (`scan_key`, `batch_number`, `product_name`, `bags`, `unit_weight`, `warehouse_zone`, `scanned_by`, `direction`, `scan_date`, `scan_time`) VALUES
('s1', 'B-2610-131', 'Miniket Premium 25 Kg', 120, '25 Kg', 'Zone A', 'Rafiqul I. (Staff)', 'Out', '24 Oct 2026', '10:42'),
('s2', 'B-2610-130', 'Basmati Royal 25 Kg', 85, '25 Kg', 'Zone B', 'Tanvir A. (Staff)', 'Out', '24 Oct 2026', '10:39'),
('s3', 'B-2610-128', 'Nazirshail Special 50 Kg', 450, '50 Kg', 'Floor-1', 'Kamal H. (Manager)', 'In', '24 Oct 2026', '10:31'),
('s4', 'B-2610-124', 'Kataribhog Aromatic 25 Kg', 14, '25 Kg', 'Zone A', 'Rafiqul I. (Staff)', 'Damaged', '24 Oct 2026', '10:18'),
('s5', 'B-2610-120', 'Gulf Parboiled 50 Kg', 300, '50 Kg', 'Floor-2', 'Kamal H. (Manager)', 'In', '24 Oct 2026', '09:57'),
('s6', 'B-2610-119', 'Chinigura Export 25 Kg', 210, '25 Kg', 'Zone B', 'Tanvir A. (Staff)', 'Out', '24 Oct 2026', '09:44'),
('s7', 'B-2610-118', 'Miniket Premium 25 Kg', 600, '25 Kg', 'Zone A', 'Mahmudul H. (Super Admin)', 'In', '24 Oct 2026', '09:20'),
('s8', 'B-2610-115', 'Basmati Royal 25 Kg', 8, '25 Kg', 'Floor-1', 'Rafiqul I. (Staff)', 'Damaged', '23 Oct 2026', '18:52')
ON DUPLICATE KEY UPDATE `product_name`=VALUES(`product_name`);

-- Damages
INSERT INTO `damages` (`damage_code`, `batch_number`, `product_name`, `bags`, `reason`, `reported_by`, `photo_url`, `notes`, `damage_date`, `damage_time`) VALUES
('DMG-104', 'B-2610-124', 'Kataribhog Aromatic 25 Kg', 14, 'Torn Bag', 'Rafiqul I.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop&auto=format', 'Pallet hook tear during Zone A stack rotation.', '24 Oct 2026', '10:18'),
('DMG-103', 'B-2610-115', 'Basmati Royal 25 Kg', 8, 'Moisture/Water Damage', 'Kamal H.', 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop&auto=format', 'Rainwater seepage near shutter gate on Floor-1.', '24 Oct 2026', '08:52'),
('DMG-102', 'B-2610-099', 'Nazirshail Special 50 Kg', 11, 'Weight Shortage', 'Kamal H.', NULL, 'Digital scale check recorded 47.4 Kg instead of 50 Kg.', '23 Oct 2026', '16:30'),
('DMG-101', 'B-2610-084', 'Gulf Parboiled 50 Kg', 6, 'Quality Issue', 'Mahmudul H.', NULL, 'Broken grain ratio exceeded 12% QA threshold.', '22 Oct 2026', '11:45')
ON DUPLICATE KEY UPDATE `reason`=VALUES(`reason`);

-- Expenses
INSERT INTO `expenses` (`voucher_no`, `category`, `amount`, `expense_date`, `expense_time`, `note`, `entered_by`) VALUES
('VCH-2610-01', 'Labor & Wages', 7200.00, CURDATE(), '11:15', 'Zone A & Floor-1 unloading shift crew (12 workers)', 'Kamal H. (Manager)'),
('VCH-2610-02', 'Transport & Freight', 11500.00, CURDATE(), '09:40', 'Covered van freight — Chattogram port to Tejgaon 1,500 sq ft depot', 'Mahmudul H. (Super Admin)'),
('VCH-2610-03', 'Office & Warehouse', 3400.00, CURDATE(), '08:20', 'DESCO warehouse electricity & thermal label roll restock', 'Kamal H. (Manager)'),
('VCH-2610-04', 'Others', 1450.00, CURDATE(), '13:30', 'Afternoon loader staff lunch, drinking water & tea', 'Rafiqul I. (Staff)'),
('VCH-2610-05', 'Labor & Wages', 6400.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '17:45', 'Inbound Lot B-2610-118 restacking on Floor-2', 'Kamal H. (Manager)'),
('VCH-2610-06', 'Transport & Freight', 16800.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '12:00', 'Two 5-ton trucks — Bogura mill inbound challan CHL-9018', 'Mahmudul H. (Super Admin)'),
('VCH-2610-07', 'Office & Warehouse', 8900.00, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '10:30', 'Industrial dehumidifier service & broadband internet bill', 'Mahmudul H. (Super Admin)'),
('VCH-2610-08', 'Others', 2100.00, DATE_SUB(CURDATE(), INTERVAL 18 DAY), '21:15', 'Monthly inventory audit crew dinner & snacks', 'Kamal H. (Manager)')
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);
