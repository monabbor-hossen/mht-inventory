import mysql from 'mysql2/promise'
import { getDbConfig } from './db'

export async function initializeDatabase() {
  const config = getDbConfig()

  // First connect without specifying database to ensure database exists
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  })

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    )
    await connection.query(`USE \`${config.database}\`;`)

    // 1. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` VARCHAR(50) NOT NULL UNIQUE,
        \`name\` VARCHAR(100) NOT NULL,
        \`role\` ENUM('Super Admin', 'Manager', 'Staff') NOT NULL DEFAULT 'Staff',
        \`password\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(30) DEFAULT NULL,
        \`status\` ENUM('Active', 'Suspended') DEFAULT 'Active',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_role\` (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 2. Inbound Batches Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`inbound_batches\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`batch_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`supplier_name\` VARCHAR(150) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL DEFAULT 'Grain & Rice',
        \`origin\` VARCHAR(50) NOT NULL DEFAULT 'Local',
        \`challan_number\` VARCHAR(100) NOT NULL,
        \`product_name\` VARCHAR(150) NOT NULL,
        \`bags_count\` INT NOT NULL DEFAULT 0,
        \`unit_weight\` VARCHAR(30) NOT NULL DEFAULT '25 Kg',
        \`numeric_kg\` DECIMAL(10,2) NOT NULL DEFAULT 25.00,
        \`total_tonnes\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`warehouse_zone\` VARCHAR(50) NOT NULL DEFAULT 'Zone A',
        \`printer_name\` VARCHAR(150) DEFAULT NULL,
        \`received_by\` VARCHAR(100) NOT NULL DEFAULT 'Admin',
        \`status\` ENUM('Draft', 'Completed', 'Received', 'In Stock', 'Dispatched', 'Damaged') DEFAULT 'Completed',
        \`received_date\` DATE NOT NULL,
        \`received_time\` VARCHAR(20) NOT NULL,
        \`notes\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_supplier\` (\`supplier_name\`),
        INDEX \`idx_zone\` (\`warehouse_zone\`),
        INDEX \`idx_date\` (\`received_date\`),
        INDEX \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 3. Barcodes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`barcodes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`uid\` VARCHAR(100) NOT NULL UNIQUE,
        \`batch_number\` VARCHAR(50) NOT NULL,
        \`product_name\` VARCHAR(150) DEFAULT NULL,
        \`unit_weight\` VARCHAR(30) DEFAULT '25 Kg',
        \`warehouse_zone\` VARCHAR(50) DEFAULT 'Zone A',
        \`status\` ENUM('In_Stock', 'Dispatched', 'Damaged', 'Void') NOT NULL DEFAULT 'In_Stock',
        \`scanned_by\` VARCHAR(100) DEFAULT NULL,
        \`scanned_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_barcode_batch\` (\`batch_number\`),
        INDEX \`idx_barcode_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 4. Scans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`scans\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`scan_key\` VARCHAR(50) NOT NULL UNIQUE,
        \`barcode_uid\` VARCHAR(100) DEFAULT NULL,
        \`batch_number\` VARCHAR(50) NOT NULL,
        \`product_name\` VARCHAR(150) NOT NULL,
        \`bags\` INT NOT NULL DEFAULT 1,
        \`unit_weight\` VARCHAR(30) NOT NULL DEFAULT '25 Kg',
        \`warehouse_zone\` VARCHAR(50) NOT NULL DEFAULT 'Zone A',
        \`scanned_by\` VARCHAR(100) NOT NULL,
        \`direction\` ENUM('In', 'Out', 'Damaged') NOT NULL,
        \`scan_date\` VARCHAR(30) NOT NULL,
        \`scan_time\` VARCHAR(20) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_batch\` (\`batch_number\`),
        INDEX \`idx_direction\` (\`direction\`),
        INDEX \`idx_scandate\` (\`scan_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 5. Damages Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`damages\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`damage_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`barcode_uid\` VARCHAR(100) DEFAULT NULL,
        \`batch_number\` VARCHAR(50) NOT NULL,
        \`product_name\` VARCHAR(150) NOT NULL,
        \`bags\` INT NOT NULL DEFAULT 1,
        \`reason\` ENUM('Torn Bag', 'Moisture/Water Damage', 'Weight Shortage', 'Quality Issue') NOT NULL,
        \`reported_by\` VARCHAR(100) NOT NULL,
        \`photo_url\` TEXT DEFAULT NULL,
        \`notes\` TEXT DEFAULT NULL,
        \`damage_date\` VARCHAR(30) NOT NULL,
        \`damage_time\` VARCHAR(20) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_damage_batch\` (\`batch_number\`),
        INDEX \`idx_reason\` (\`reason\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 6. Expenses Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`expenses\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`voucher_no\` VARCHAR(50) NOT NULL UNIQUE,
        \`category\` ENUM('Transport & Freight', 'Labor & Wages', 'Office & Warehouse', 'Others') NOT NULL,
        \`amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`expense_date\` DATE NOT NULL,
        \`expense_time\` VARCHAR(20) NOT NULL,
        \`note\` TEXT NOT NULL,
        \`receipt_url\` TEXT DEFAULT NULL,
        \`entered_by\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_cat\` (\`category\`),
        INDEX \`idx_exp_date\` (\`expense_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 7. Activity Logs (Audit Trail)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`activity_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` VARCHAR(50) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`action_type\` VARCHAR(50) NOT NULL,
        \`target_id\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_activity_user\` (\`user_id\`),
        INDEX \`idx_activity_time\` (\`timestamp\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 8. Settings Table (Petty Cash Fund, etc.)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`setting_key\` VARCHAR(50) PRIMARY KEY,
        \`setting_value\` TEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 9. Offline Sync Log Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`offline_sync_log\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`client_record_id\` VARCHAR(50) NOT NULL,
        \`record_kind\` ENUM('Scan', 'Expense', 'Damage') NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`subtitle\` VARCHAR(255) DEFAULT NULL,
        \`synced_by\` VARCHAR(100) DEFAULT 'Staff',
        \`synced_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Safe column migrations for existing tables
    try {
      await connection.query('ALTER TABLE `inbound_batches` ADD COLUMN `category` VARCHAR(100) NOT NULL DEFAULT "Rice & Grain" AFTER `supplier_name`')
    } catch (_) {}
    try {
      await connection.query('ALTER TABLE `inbound_batches` MODIFY COLUMN `status` ENUM("Draft", "Completed", "Received", "In Stock", "Dispatched", "Damaged") DEFAULT "Completed"')
    } catch (_) {}
    try {
      await connection.query('ALTER TABLE `expenses` ADD COLUMN `receipt_url` TEXT DEFAULT NULL AFTER `note`')
    } catch (_) {}
    try {
      await connection.query('ALTER TABLE `scans` ADD COLUMN `barcode_uid` VARCHAR(100) DEFAULT NULL AFTER `scan_key`')
    } catch (_) {}
    try {
      await connection.query('ALTER TABLE `damages` ADD COLUMN `barcode_uid` VARCHAR(100) DEFAULT NULL AFTER `damage_code`')
    } catch (_) {}

    // Ensure default settings exist (e.g. Petty Cash fund = 50000)
    await connection.query(`
      INSERT INTO \`settings\` (\`setting_key\`, \`setting_value\`)
      VALUES ('petty_cash_fund', '50000')
      ON DUPLICATE KEY UPDATE \`setting_key\` = \`setting_key\`;
    `)

    // Seed default users if none exist
    const [userCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM users')
    if (userCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`users\` (\`user_id\`, \`name\`, \`role\`, \`password\`) VALUES
        ('MHT-ADMIN-01', 'Mahmudul H. (Super Admin)', 'Super Admin', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
        ('MHT-MGR-04', 'Kamal H. (Manager)', 'Manager', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
        ('MHT-OPR-12', 'Rafiqul I. (Staff)', 'Staff', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu'),
        ('MHT-OPR-15', 'Tanvir A. (Staff)', 'Staff', '$2a$10$0zX7P8N8t5m4h2WzK0/o9eYv7c.H1Fq7gY4aCZbQdKkP7iGqD1mKu');
      `)
    }

    // Seed default batches if none exist
    const [batchCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM inbound_batches')
    if (batchCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`inbound_batches\` (\`batch_number\`, \`supplier_name\`, \`category\`, \`origin\`, \`challan_number\`, \`product_name\`, \`bags_count\`, \`unit_weight\`, \`numeric_kg\`, \`total_tonnes\`, \`warehouse_zone\`, \`printer_name\`, \`received_by\`, \`status\`, \`received_date\`, \`received_time\`) VALUES
        ('B-2610-131', 'Nabil Auto Flour & Rice Mills', 'Rice & Grain', 'Local', 'LC-DHK-2026-8841', 'Miniket Premium 25 Kg', 450, '25 Kg', 25.00, 11.25, 'Zone A', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Completed', CURDATE(), '10:42'),
        ('B-2610-130', 'Rashid Agro Food Products Ltd.', 'Rice & Grain', 'Local', 'LC-DHK-2026-8840', 'Basmati Royal 25 Kg', 300, '25 Kg', 25.00, 7.50, 'Zone B', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Completed', CURDATE(), '10:39'),
        ('B-2610-128', 'Nabil Auto Flour & Rice Mills', 'Rice & Grain', 'Local', 'CHL-9021', 'Nazirshail Special 50 Kg', 600, '50 Kg', 50.00, 30.00, 'Floor-1', 'TSC TE244 via USB', 'Mahmudul H. (Super Admin)', 'Completed', CURDATE(), '10:31'),
        ('B-2610-124', 'Al-Haramain Gulf Commodities (UAE)', 'Imported Grains', 'Middle East', 'LC-CTG-2026-1102', 'Kataribhog Aromatic 25 Kg', 200, '25 Kg', 25.00, 5.00, 'Zone A', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Completed', CURDATE(), '10:18'),
        ('B-2610-120', 'TK Group Commodity Division', 'Imported Grains', 'Middle East', 'LC-CTG-2026-1099', 'Gulf Parboiled 50 Kg', 500, '50 Kg', 50.00, 25.00, 'Floor-2', 'TSC TE244 via Network', 'Kamal H. (Manager)', 'Completed', CURDATE(), '09:57'),
        ('B-2610-118', 'Akij Essential Grains Ltd.', 'Rice & Grain', 'Local', 'CHL-8977', 'Miniket Premium 25 Kg', 800, '25 Kg', 25.00, 20.00, 'Zone A', 'TSC TE244 via USB', 'Mahmudul H. (Super Admin)', 'Completed', CURDATE(), '09:20');
      `)
    }

    // Seed default barcodes if none exist
    const [barcodeCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM barcodes')
    if (barcodeCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`barcodes\` (\`uid\`, \`batch_number\`, \`product_name\`, \`unit_weight\`, \`warehouse_zone\`, \`status\`) VALUES
        ('B-2610-131-001', 'B-2610-131', 'Miniket Premium 25 Kg', '25 Kg', 'Zone A', 'Dispatched'),
        ('B-2610-131-002', 'B-2610-131', 'Miniket Premium 25 Kg', '25 Kg', 'Zone A', 'In_Stock'),
        ('B-2610-131-003', 'B-2610-131', 'Miniket Premium 25 Kg', '25 Kg', 'Zone A', 'In_Stock'),
        ('B-2610-130-001', 'B-2610-130', 'Basmati Royal 25 Kg', '25 Kg', 'Zone B', 'Dispatched'),
        ('B-2610-130-002', 'B-2610-130', 'Basmati Royal 25 Kg', '25 Kg', 'Zone B', 'In_Stock'),
        ('B-2610-128-001', 'B-2610-128', 'Nazirshail Special 50 Kg', '50 Kg', 'Floor-1', 'In_Stock'),
        ('B-2610-124-001', 'B-2610-124', 'Kataribhog Aromatic 25 Kg', '25 Kg', 'Zone A', 'Damaged');
      `)
    }

    // Seed default scans if none exist
    const [scanCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM scans')
    if (scanCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`scans\` (\`scan_key\`, \`batch_number\`, \`product_name\`, \`bags\`, \`unit_weight\`, \`warehouse_zone\`, \`scanned_by\`, \`direction\`, \`scan_date\`, \`scan_time\`) VALUES
        ('s1', 'B-2610-131', 'Miniket Premium 25 Kg', 120, '25 Kg', 'Zone A', 'Rafiqul I. (Staff)', 'Out', '24 Oct 2026', '10:42'),
        ('s2', 'B-2610-130', 'Basmati Royal 25 Kg', 85, '25 Kg', 'Zone B', 'Tanvir A. (Staff)', 'Out', '24 Oct 2026', '10:39'),
        ('s3', 'B-2610-128', 'Nazirshail Special 50 Kg', 450, '50 Kg', 'Floor-1', 'Kamal H. (Manager)', 'In', '24 Oct 2026', '10:31'),
        ('s4', 'B-2610-124', 'Kataribhog Aromatic 25 Kg', 14, '25 Kg', 'Zone A', 'Rafiqul I. (Staff)', 'Damaged', '24 Oct 2026', '10:18'),
        ('s5', 'B-2610-120', 'Gulf Parboiled 50 Kg', 300, '50 Kg', 'Floor-2', 'Kamal H. (Manager)', 'In', '24 Oct 2026', '09:57'),
        ('s6', 'B-2610-119', 'Chinigura Export 25 Kg', 210, '25 Kg', 'Zone B', 'Tanvir A. (Staff)', 'Out', '24 Oct 2026', '09:44'),
        ('s7', 'B-2610-118', 'Miniket Premium 25 Kg', 600, '25 Kg', 'Zone A', 'Mahmudul H. (Super Admin)', 'In', '24 Oct 2026', '09:20'),
        ('s8', 'B-2610-115', 'Basmati Royal 25 Kg', 8, '25 Kg', 'Floor-1', 'Rafiqul I. (Staff)', 'Damaged', '23 Oct 2026', '18:52');
      `)
    }

    // Seed default damages if none exist
    const [damageCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM damages')
    if (damageCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`damages\` (\`damage_code\`, \`batch_number\`, \`product_name\`, \`bags\`, \`reason\`, \`reported_by\`, \`photo_url\`, \`notes\`, \`damage_date\`, \`damage_time\`) VALUES
        ('DMG-104', 'B-2610-124', 'Kataribhog Aromatic 25 Kg', 14, 'Torn Bag', 'Rafiqul I.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop&auto=format', 'Pallet hook tear during Zone A stack rotation.', '24 Oct 2026', '10:18'),
        ('DMG-103', 'B-2610-115', 'Basmati Royal 25 Kg', 8, 'Moisture/Water Damage', 'Kamal H.', 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=300&fit=crop&auto=format', 'Rainwater seepage near shutter gate on Floor-1.', '24 Oct 2026', '08:52'),
        ('DMG-102', 'B-2610-099', 'Nazirshail Special 50 Kg', 11, 'Weight Shortage', 'Kamal H.', NULL, 'Digital scale check recorded 47.4 Kg instead of 50 Kg.', '23 Oct 2026', '16:30'),
        ('DMG-101', 'B-2610-084', 'Gulf Parboiled 50 Kg', 6, 'Quality Issue', 'Mahmudul H.', NULL, 'Broken grain ratio exceeded 12% QA threshold.', '22 Oct 2026', '11:45');
      `)
    }

    // Seed default expenses if none exist
    const [expenseCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM expenses')
    if (expenseCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`expenses\` (\`voucher_no\`, \`category\`, \`amount\`, \`expense_date\`, \`expense_time\`, \`note\`, \`entered_by\`) VALUES
        ('VCH-2610-01', 'Labor & Wages', 7200.00, CURDATE(), '11:15', 'Zone A & Floor-1 unloading shift crew (12 workers)', 'Kamal H. (Manager)'),
        ('VCH-2610-02', 'Transport & Freight', 11500.00, CURDATE(), '09:40', 'Covered van freight — Chattogram port to Tejgaon 1,500 sq ft depot', 'Mahmudul H. (Super Admin)'),
        ('VCH-2610-03', 'Office & Warehouse', 3400.00, CURDATE(), '08:20', 'DESCO warehouse electricity & thermal label roll restock', 'Kamal H. (Manager)'),
        ('VCH-2610-04', 'Others', 1450.00, CURDATE(), '13:30', 'Afternoon loader staff lunch, drinking water & tea', 'Rafiqul I. (Staff)'),
        ('VCH-2610-05', 'Labor & Wages', 6400.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '17:45', 'Inbound Lot B-2610-118 restacking on Floor-2', 'Kamal H. (Manager)'),
        ('VCH-2610-06', 'Transport & Freight', 16800.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '12:00', 'Two 5-ton trucks — Bogura mill inbound challan CHL-9018', 'Mahmudul H. (Super Admin)'),
        ('VCH-2610-07', 'Office & Warehouse', 8900.00, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '10:30', 'Industrial dehumidifier service & broadband internet bill', 'Mahmudul H. (Super Admin)'),
        ('VCH-2610-08', 'Others', 2100.00, DATE_SUB(CURDATE(), INTERVAL 18 DAY), '21:15', 'Monthly inventory audit crew dinner & snacks', 'Kamal H. (Manager)');
      `)
    }

    // Seed default activity logs if none exist
    const [actCountRows]: [any, any] = await connection.query('SELECT COUNT(*) as count FROM activity_logs')
    if (actCountRows[0].count === 0) {
      await connection.query(`
        INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`action_type\`, \`target_id\`, \`description\`) VALUES
        ('MHT-ADMIN-01', 'Mahmudul H. (Super Admin)', 'CREATE_BATCH', 'B-2610-131', 'Created inbound batch for Nabil Auto Flour (450 bags)'),
        ('MHT-MGR-04', 'Kamal H. (Manager)', 'PRINT_BARCODES', 'B-2610-131', 'Printed 450 barcode stickers to TSC TE244'),
        ('MHT-OPR-12', 'Rafiqul I. (Staff)', 'OUTBOUND_SCAN', 'B-2610-131', 'Dispatched 120 bags of Miniket Premium from Zone A'),
        ('MHT-OPR-12', 'Rafiqul I. (Staff)', 'LOG_DAMAGE', 'DMG-104', 'Logged 14 torn bags for Lot B-2610-124 in Zone A'),
        ('MHT-MGR-04', 'Kamal H. (Manager)', 'LOG_EXPENSE', 'VCH-2610-01', 'Added labor wages voucher of 7,200 BDT for unloading crew');
      `)
    }

    return {
      success: true,
      message: 'Database tables and initial records successfully created/verified.',
      database: config.database,
    }
  } finally {
    await connection.end()
  }
}
