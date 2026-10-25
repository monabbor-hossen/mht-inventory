# MHT Inventory & Ledger — Next.js MySQL REST API

A production-ready Next.js REST API with MySQL connection pooling, CORS support, offline sync processing, and an interactive live testing console. Designed to deploy seamlessly on **Hostinger Web Hosting (Node.js)** and **Local XAMPP**.

---

## 📁 Project Structure

```
inventory/
├── api/                             <-- YOUR NEXT.JS API BACKEND
│   ├── database.sql                 <-- Import into phpMyAdmin (XAMPP / Hostinger)
│   ├── .env.local                   <-- Local environment variables (XAMPP)
│   ├── .env.example                 <-- Production reference for Hostinger
│   ├── package.json
│   ├── next.config.mjs              <-- Global CORS headers configured
│   ├── scripts/
│   │   └── init-db.mjs              <-- CLI database migration runner
│   └── src/
│       ├── lib/
│       │   ├── db.ts                <-- MySQL connection pool & query methods
│       │   ├── init.ts              <-- Auto table creation & seed demo data
│       │   ├── cors.ts              <-- Cross-Origin header helpers
│       │   └── types.ts             <-- Full TypeScript interfaces
│       └── app/
│           ├── layout.tsx
│           ├── page.tsx             <-- Live interactive API tester dashboard
│           ├── globals.css
│           └── api/
│               ├── health/          <-- GET /api/health (MySQL ping & status)
│               ├── init-db/         <-- POST /api/init-db (Auto create tables)
│               ├── auth/login/      <-- POST /api/auth/login
│               ├── auth/users/      <-- GET, POST /api/auth/users
│               ├── dashboard/       <-- GET /api/dashboard (Stock KPIs, 7-day flow)
│               ├── inbound/         <-- GET, POST /api/inbound (Batches & stock intake)
│               ├── scans/           <-- GET, POST /api/scans (In, Out, Damaged)
│               ├── damages/         <-- GET, POST /api/damages (Damaged items & photos)
│               ├── expenses/        <-- GET, POST, DELETE /api/expenses (Ledger vouchers)
│               ├── sync/            <-- POST, GET /api/sync (Offline queue sync)
│               └── reports/         <-- GET /api/reports (JSON & CSV export)
└── figma/                           <-- Frontend testing folder
```

---

## 🗄️ MySQL Database Schema & Fields

The database schema is defined in [database.sql](database.sql):

### 1. `users`
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `user_id` | VARCHAR(50) UNIQUE | Staff / Admin code (e.g. `MHT-ADMIN-01`) |
| `name` | VARCHAR(100) | Full Name |
| `role` | ENUM | `'Super Admin'`, `'Manager'`, `'Staff'` |
| `password` | VARCHAR(255) | Bcrypt hashed password |
| `phone` | VARCHAR(30) | Optional phone number |
| `status` | ENUM | `'Active'`, `'Suspended'` |

### 2. `inbound_batches`
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `batch_number` | VARCHAR(50) UNIQUE | Lot number (e.g. `B-2610-131`) |
| `supplier_name` | VARCHAR(150) | Supplier / Mill |
| `origin` | VARCHAR(50) | `'Local'`, `'Middle East'`, `'Others'` |
| `challan_number` | VARCHAR(100) | LC or Challan reference |
| `product_name` | VARCHAR(150) | Product description |
| `bags_count` | INT | Number of bags |
| `unit_weight` | VARCHAR(30) | Weight label (`25 Kg`, `50 Kg`, etc.) |
| `numeric_kg` | DECIMAL(10,2) | Numeric weight in Kg |
| `total_tonnes` | DECIMAL(10,2) | Calculated metric tons |
| `warehouse_zone`| VARCHAR(50) | `'Zone A'`, `'Zone B'`, `'Floor-1'`, `'Floor-2'` |
| `printer_name` | VARCHAR(150) | TSC TE244 printer target |
| `received_by` | VARCHAR(100) | Receiver staff/admin name |
| `received_date` | DATE | Date received |
| `received_time` | VARCHAR(20) | Time received |

### 3. `scans` (Stock Movements)
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `scan_key` | VARCHAR(50) UNIQUE | Unique scan hash / key |
| `batch_number` | VARCHAR(50) | Associated batch |
| `product_name` | VARCHAR(150) | Product name |
| `bags` | INT | Quantity of bags scanned |
| `unit_weight` | VARCHAR(30) | Unit weight |
| `warehouse_zone`| VARCHAR(50) | Zone scanned in |
| `scanned_by` | VARCHAR(100) | Staff member |
| `direction` | ENUM | `'In'`, `'Out'`, `'Damaged'` |
| `scan_date` | VARCHAR(30) | Scan date |
| `scan_time` | VARCHAR(20) | Scan time |

### 4. `damages`
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `damage_code` | VARCHAR(50) UNIQUE | Code (e.g. `DMG-104`) |
| `batch_number` | VARCHAR(50) | Associated batch |
| `product_name` | VARCHAR(150) | Product name |
| `bags` | INT | Damaged bag count |
| `reason` | ENUM | `'Torn Bag'`, `'Moisture/Water Damage'`, `'Weight Shortage'`, `'Quality Issue'` |
| `reported_by` | VARCHAR(100) | Staff name |
| `photo_url` | TEXT | Optional damage image proof URL |
| `notes` | TEXT | Damage explanation |

### 5. `expenses` (Financial Ledger)
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `voucher_no` | VARCHAR(50) UNIQUE | Voucher (e.g. `VCH-2610-01`) |
| `category` | ENUM | `'Transport & Freight'`, `'Labor & Wages'`, `'Office & Warehouse'`, `'Others'` |
| `amount` | DECIMAL(12,2) | Expense amount in BDT |
| `expense_date` | DATE | Voucher date |
| `expense_time` | VARCHAR(20) | Voucher time |
| `note` | TEXT | Description of expenditure |
| `entered_by` | VARCHAR(100) | User who recorded voucher |

### 6. `offline_sync_log`
| Field | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT (PK) | Unique ID |
| `client_record_id` | VARCHAR(50) | Mobile app record UUID |
| `record_kind` | ENUM | `'Scan'`, `'Expense'`, `'Damage'` |
| `title` | VARCHAR(255) | Summary title |
| `subtitle` | VARCHAR(255) | Subtitle details |
| `synced_by` | VARCHAR(100) | Synchronized by staff |
| `synced_at` | TIMESTAMP | Timestamp of sync |

---

## ⚡ How to Run Locally (with XAMPP)

1. **Start Apache & MySQL** in the XAMPP Control Panel.
2. Open terminal in the `api/` directory:
   ```bash
   cd c:\xampp\htdocs\inventory\api
   npm install
   ```
3. Initialize the database (creates tables & seeds initial data):
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser:
   - You will see the **Interactive Live API Console**.
   - Click **"⚡ Init / Seed Tables"** to create all tables and sample records.
   - Click **"Send Request"** on any endpoint to test live queries!

---

## 🌐 How to Deploy on Hostinger Webhost

### Step 1: Create Database on Hostinger
1. Log into your **Hostinger hPanel**.
2. Go to **Databases** → **MySQL Databases**.
3. Create a new database:
   - Database name: e.g. `u123456789_inventory`
   - Username: e.g. `u123456789_admin`
   - Password: `YourStrongPassword`
4. Click **phpMyAdmin** next to the newly created database.
5. In phpMyAdmin, click the **Import** tab.
6. Choose the `database.sql` file from this project and click **Go**. All tables and seed data will be created instantly.

### Step 2: Upload Project Files to Hostinger
You can upload via **Hostinger File Manager**, **FTP**, or **Git**:
1. Upload the contents of the `api/` folder into your domain/subdomain directory (e.g., `public_html/api` or `public_html`).
2. Create or edit `.env.production` (or set environment variables in Hostinger Node.js manager):
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=u123456789_admin
   DB_PASSWORD=YourStrongPassword
   DB_NAME=u123456789_inventory
   PORT=3000
   ```

### Step 3: Configure Hostinger Node.js Manager
1. In Hostinger hPanel, search for **Node.js**.
2. Click **Create Application**:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `api` (or wherever your `package.json` is located)
   - **Application startup file**: `node_modules/next/dist/bin/next` with argument `start` OR `npm run start`
3. Click **NPM Install** inside the Hostinger manager.
4. Run `npm run build` or build locally before uploading `.next/`.
5. Start the application.

Your API is now live on Hostinger with full MySQL support!
