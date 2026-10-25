import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'services/api_service.dart';
import 'screens/dashboard_screen.dart';
import 'screens/inbound_screen.dart';
import 'screens/scans_screen.dart';
import 'screens/expenses_screen.dart';
import 'screens/damages_screen.dart';
import 'widgets/api_config_dialog.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: const MhtInventoryApp(),
    ),
  );
}

class MhtInventoryApp extends StatelessWidget {
  const MhtInventoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MHT Inventory & Ledger',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF005C4B),
          primary: const Color(0xFF005C4B),
          secondary: const Color(0xFFFF9800),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8F9FA),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF005C4B),
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final ApiService _api = ApiService();

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
  }

  void _showRoleDialog(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Switch Role (RBAC)', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.admin_panel_settings, color: Color(0xFF005C4B)),
              title: const Text('Super Admin (Owner)'),
              subtitle: const Text('Full system access, analytics & exports'),
              selected: provider.userRole == 'Super Admin',
              onTap: () {
                provider.switchRole('Super Admin');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.manage_accounts, color: Color(0xFFFF9800)),
              title: const Text('Manager'),
              subtitle: const Text('Inbound stock, late binding, ledgers'),
              selected: provider.userRole == 'Manager',
              onTap: () {
                provider.switchRole('Manager');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.phone_android, color: Color(0xFF388E3C)),
              title: const Text('Staff (Operator)'),
              subtitle: const Text('Continuous scanning & petty expenses'),
              selected: provider.userRole == 'Staff',
              onTap: () {
                provider.switchRole('Staff');
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showOfflineSyncDialog(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.sync, color: Color(0xFF005C4B)),
            SizedBox(width: 8),
            Text('Offline Queue Engine', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Pending Offline Packets:', style: TextStyle(fontSize: 14)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: provider.pendingOfflineCount > 0
                        ? const Color(0xFFFFF3E0)
                        : const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${provider.pendingOfflineCount} Queued',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: provider.pendingOfflineCount > 0
                          ? const Color(0xFFE65100)
                          : const Color(0xFF2E7D32),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              provider.isOnline
                  ? 'Server connection active (${_api.baseUrl}). Tap below to flush offline queue to MySQL.'
                  : 'Warehouse offline mode. Scans and expenses are saved locally in persistent storage.',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);
              final res = await provider.forceSync();
              messenger.showSnackBar(
                SnackBar(content: Text(res['message'] ?? 'Sync finished')),
              );
            },
            icon: const Icon(Icons.cloud_upload),
            label: const Text('Force Sync Now'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final isStaff = provider.userRole == 'Staff';

    final allTitles = [
      'Dashboard & Stock Overview',
      'Inbound & Barcodes',
      'Continuous Batch Scanner',
      'Accounts & Daily Ledger',
      'Damages & Returns QA',
    ];

    final allScreens = [
      DashboardScreen(onNavigate: _onTabSelected),
      const InboundScreen(),
      const ScansScreen(),
      const ExpensesScreen(),
      const DamagesScreen(),
    ];

    // Staff sees only Scans, Expenses, Damages
    final titles = isStaff
        ? ['Continuous Batch Scanner', 'Quick Expense', 'Damages & Returns']
        : allTitles;

    final screens = isStaff
        ? [const ScansScreen(), const ExpensesScreen(), const DamagesScreen()]
        : allScreens;

    final activeIndex = _currentIndex.clamp(0, screens.length - 1);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titles[activeIndex],
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: provider.isOnline ? Colors.greenAccent : Colors.redAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  provider.isOnline ? 'MySQL Connected' : 'Offline Mode',
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Offline sync button with pending count badge
          IconButton(
            tooltip: 'Offline Queue Status',
            onPressed: () => _showOfflineSyncDialog(context, provider),
            icon: Badge(
              isLabelVisible: provider.pendingOfflineCount > 0,
              label: Text('${provider.pendingOfflineCount}'),
              backgroundColor: const Color(0xFFFF9800),
              child: Icon(
                provider.pendingOfflineCount > 0 ? Icons.sync_problem : Icons.cloud_done,
                color: Colors.white,
              ),
            ),
          ),

          // Role Switcher Button
          TextButton.icon(
            onPressed: () => _showRoleDialog(context, provider),
            icon: const Icon(Icons.person, color: Colors.white, size: 16),
            label: Text(
              provider.userRole,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            ),
            style: TextButton.styleFrom(
              backgroundColor: Colors.white12,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          const SizedBox(width: 4),

          // Server Config Dialog
          IconButton(
            tooltip: 'API URL Settings',
            icon: const Icon(Icons.settings),
            onPressed: () => showDialog(
              context: context,
              builder: (_) => const ApiConfigDialog(),
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: activeIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: activeIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        indicatorColor: const Color(0xFF005C4B).withValues(alpha: 0.15),
        destinations: isStaff
            ? const [
                NavigationDestination(
                  icon: Icon(Icons.qr_code_scanner_outlined),
                  selectedIcon: Icon(Icons.qr_code_scanner, color: Color(0xFF005C4B)),
                  label: 'Smart Scan',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF005C4B)),
                  label: 'Petty Expense',
                ),
                NavigationDestination(
                  icon: Icon(Icons.report_problem_outlined),
                  selectedIcon: Icon(Icons.report_problem, color: Color(0xFF005C4B)),
                  label: 'Damages QA',
                ),
              ]
            : const [
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard, color: Color(0xFF005C4B)),
                  label: 'Dashboard',
                ),
                NavigationDestination(
                  icon: Icon(Icons.move_to_inbox_outlined),
                  selectedIcon: Icon(Icons.move_to_inbox, color: Color(0xFF005C4B)),
                  label: 'Inbound',
                ),
                NavigationDestination(
                  icon: Icon(Icons.qr_code_scanner_outlined),
                  selectedIcon: Icon(Icons.qr_code_scanner, color: Color(0xFF005C4B)),
                  label: 'Smart Scan',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF005C4B)),
                  label: 'Accounts',
                ),
                NavigationDestination(
                  icon: Icon(Icons.report_problem_outlined),
                  selectedIcon: Icon(Icons.report_problem, color: Color(0xFF005C4B)),
                  label: 'Damages',
                ),
              ],
      ),
    );
  }
}
