# MHT Inventory & Ledger — Flutter Mobile & Desktop App

A cross-platform Flutter application (Android, iOS, Windows, Web) connected directly to your Next.js MySQL REST API backend.

---

## 📱 Features

1. **Dashboard Overview**:
   - Live KPI cards: Total Stock, Dispatched Today, Damaged Stock, Expenses Today.
   - 7-day flow tracker (Stock In vs Stock Out).
   - Real-time API & MySQL connection health indicator.
   - Recent movements feed with pull-to-refresh.

2. **Inbound Shipments (View & Insert)**:
   - Browse received batches with search by batch, supplier, product, or zone.
   - **`+ Receive Batch`** button: Interactive bottom sheet form to insert new shipment directly into MySQL via the API.

3. **Stock Scans / Movements (View & Insert)**:
   - Filter scans by `Out (Dispatch)`, `In (Intake)`, or `Damaged`.
   - **`+ Log Scan`** button: Record instant barcode scan operations with quantity and zone.

4. **Expense Ledger (View & Insert)**:
   - View categorized expenditures (`Labor & Wages`, `Transport & Freight`, `Office & Warehouse`, `Others`).
   - Total amount banner calculation.
   - **`+ Add Voucher`** button: Insert new financial ledger vouchers into MySQL.

5. **Damages & Returns (View & Insert)**:
   - Track damaged inventory with reasons (`Torn Bag`, `Moisture/Water Damage`, etc.).
   - **`+ Report Damage`** button: File new damage report and deduct stock from active inventory.

6. **Instant Server Switcher**:
   - Tap the **Settings icon** in the top AppBar to toggle between:
     - `http://localhost:3000` (Local testing)
     - `http://10.0.2.2:3000` (Android Studio Emulator)
     - `https://mhtria.space` (Your live Hostinger domain)
     - Includes a built-in "Test Ping" tool!

---

## 🚀 How to Run the Flutter App

From your terminal in `c:\xampp\htdocs\inventory\inventory_app`:

### Run on Windows Desktop:
```bash
flutter run -d windows
```

### Run on Chrome (Web):
```bash
flutter run -d chrome
```

### Run on Android Emulator / Phone:
```bash
flutter run
```

---

## 📁 Project Structure

```
inventory_app/
├── lib/
│   ├── main.dart                       <-- App entry point & bottom navigation
│   ├── models/
│   │   └── models.dart                 <-- Dart models for API responses
│   ├── services/
│   │   └── api_service.dart            <-- HTTP client for all /api endpoints
│   ├── screens/
│   │   ├── dashboard_screen.dart       <-- Stock KPIs & 7-day overview
│   │   ├── inbound_screen.dart         <-- View & Insert Inbound Batches
│   │   ├── scans_screen.dart           <-- View & Insert Stock Movements
│   │   ├── expenses_screen.dart        <-- View & Insert Expense Vouchers
│   │   └── damages_screen.dart         <-- View & Insert Damage Reports
│   └── widgets/
│       └── api_config_dialog.dart      <-- Switch between Local & Hostinger URL
└── pubspec.yaml
```
