import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/offline_sync_service.dart';

class AppProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final OfflineSyncService _offlineSync = OfflineSyncService();

  String _userRole = 'Staff'; // Default for mobile operator
  String _userName = 'Rafiqul I. (Staff)';
  String _actionMode = 'Dispatch Mode'; // 'Dispatch Mode' or 'Damage Mode'
  int _sessionScanCount = 0;
  bool _isOnline = true;

  List<ScanItem> _scans = [];
  List<InboundBatch> _batches = [];
  List<DamageItem> _damages = [];
  List<ExpenseItem> _expenses = [];

  String get userRole => _userRole;
  String get userName => _userName;
  String get actionMode => _actionMode;
  int get sessionScanCount => _sessionScanCount;
  bool get isOnline => _isOnline;
  int get pendingOfflineCount => _offlineSync.pendingCount;
  SyncState get syncState => _offlineSync.syncState;

  List<ScanItem> get scans => _scans;
  List<InboundBatch> get batches => _batches;
  List<DamageItem> get damages => _damages;
  List<ExpenseItem> get expenses => _expenses;

  AppProvider() {
    _init();
  }

  Future<void> _init() async {
    await _offlineSync.init();
    _offlineSync.addListener(notifyListeners);
    await checkConnectivityAndRefresh();
  }

  Future<void> checkConnectivityAndRefresh() async {
    final health = await _api.checkHealth();
    _isOnline = health['success'] == true;
    notifyListeners();

    if (_isOnline) {
      try {
        final fetchedBatches = await _api.fetchInboundBatches();
        _batches = fetchedBatches;
      } catch (_) {}

      try {
        final fetchedScans = await _api.fetchScans();
        _scans = fetchedScans;
      } catch (_) {}

      try {
        final fetchedDamages = await _api.fetchDamages();
        _damages = fetchedDamages;
      } catch (_) {}

      try {
        final fetchedExpenses = await _api.fetchExpenses();
        _expenses = fetchedExpenses;
      } catch (_) {}

      // Auto-sync offline queue if items pending
      if (_offlineSync.pendingCount > 0) {
        await _offlineSync.syncAll(_api);
      }
      notifyListeners();
    }
  }

  void switchRole(String role) {
    _userRole = role;
    if (role == 'Super Admin') {
      _userName = 'Mahmudul H. (Super Admin)';
    } else if (role == 'Manager') {
      _userName = 'Kamal H. (Manager)';
    } else {
      _userName = 'Rafiqul I. (Staff)';
    }
    notifyListeners();
  }

  void setActionMode(String mode) {
    _actionMode = mode;
    notifyListeners();
  }

  void resetSessionCounter() {
    _sessionScanCount = 0;
    notifyListeners();
  }

  // Scan Processing: Duplicate Check, FIFO Alert, Haptic Feedback & Offline Queuing
  Future<Map<String, dynamic>> processScan({
    required String batchId,
    String? barcode,
    String product = 'Commodity Bag',
    int bags = 1,
    String zone = 'Zone A',
  }) async {
    final cleanBatch = batchId.trim().toUpperCase();

    // 1. DUPLICATE PREVENTION:
    final alreadyScanned = _scans.any(
      (s) => (s.batchNumber == cleanBatch || (barcode != null && s.barcode == barcode)) && s.direction == 'Out',
    );

    if (alreadyScanned && _actionMode == 'Dispatch Mode') {
      // Aggressive vibration for duplicate
      HapticFeedback.heavyImpact();
      return {
        'duplicate': true,
        'message': 'Batch [$cleanBatch] has already been dispatched! Duplicate scan rejected.',
        'batch': cleanBatch,
      };
    }

    // 2. FIFO (First-In, First-Out) CHECK:
    Map<String, dynamic>? fifoAlert;
    if (_actionMode == 'Dispatch Mode') {
      // Find older batches of the same product with remaining bags
      final currentBatchIndex = _batches.indexWhere((b) => b.batchNumber == cleanBatch);
      if (currentBatchIndex != -1) {
        final currentBatch = _batches[currentBatchIndex];
        final older = _batches.firstWhere(
          (b) =>
              b.productName == currentBatch.productName &&
              (b.id ?? 0) < (currentBatch.id ?? 999999) &&
              b.bagsCount > 0 &&
              b.batchNumber != cleanBatch,
          orElse: () => InboundBatch(
            batchNumber: '',
            supplierName: '',
            origin: '',
            challanNumber: '',
            productName: '',
            bagsCount: 0,
            unitWeight: '',
            totalTonnes: 0,
            warehouseZone: '',
          ),
        );

        if (older.batchNumber.isNotEmpty) {
          fifoAlert = {
            'olderBatch': older.batchNumber,
            'message': 'Older batch [${older.batchNumber}] (${older.bagsCount} bags left) is still in stock. Please dispatch older stock first.',
          };
        }
      }
    }

    final now = DateTime.now();
    final scanItem = ScanItem(
      scanKey: 's_mob_${DateTime.now().millisecondsSinceEpoch}',
      barcode: barcode,
      batchNumber: cleanBatch,
      productName: product,
      bags: bags,
      unitWeight: '25 Kg',
      warehouseZone: zone,
      scannedBy: _userName,
      direction: _actionMode == 'Damage Mode' ? 'Damaged' : 'Out',
      scanDate: '${now.day.toString().padLeft(2, '0')} ${_monthName(now.month)} ${now.year}',
      scanTime: '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
    );

    // Light impact haptic for successful scan
    HapticFeedback.lightImpact();

    // Deduct local cache stock
    final bIdx = _batches.indexWhere((b) => b.batchNumber == cleanBatch);
    if (bIdx != -1) {
      final old = _batches[bIdx];
      _batches[bIdx] = InboundBatch(
        id: old.id,
        batchNumber: old.batchNumber,
        supplierName: old.supplierName,
        category: old.category,
        origin: old.origin,
        challanNumber: old.challanNumber,
        productName: old.productName,
        bagsCount: (old.bagsCount - bags).clamp(0, 999999),
        unitWeight: old.unitWeight,
        totalTonnes: old.totalTonnes,
        warehouseZone: old.warehouseZone,
        status: old.status,
      );
    }

    _scans.insert(0, scanItem);
    _sessionScanCount++;
    notifyListeners();

    // 3. ONLINE OR OFFLINE ENGINE
    if (_isOnline) {
      try {
        final res = await _api.postScan(scanItem);
        if (res['duplicate'] == true) {
          return res;
        }
        if (res['fifoAlert'] != null) {
          fifoAlert = Map<String, dynamic>.from(res['fifoAlert']);
        }
      } catch (e) {
        // If network failed midway, fallback to offline queue
        await _offlineSync.queueScan(scanItem);
      }
    } else {
      await _offlineSync.queueScan(scanItem);
    }

    return {
      'success': true,
      'duplicate': false,
      'batch': cleanBatch,
      'fifoAlert': fifoAlert,
      'offline': !_isOnline,
    };
  }

  // Record Damage
  Future<bool> recordDamage(DamageItem item) async {
    _damages.insert(0, item);
    notifyListeners();

    if (_isOnline) {
      try {
        final res = await _api.createDamage(item);
        return res['success'] == true;
      } catch (_) {
        await _offlineSync.queueDamage(item);
        return true;
      }
    } else {
      await _offlineSync.queueDamage(item);
      return true;
    }
  }

  // Record Expense
  Future<bool> recordExpense(ExpenseItem item) async {
    _expenses.insert(0, item);
    notifyListeners();

    if (_isOnline) {
      try {
        final res = await _api.createExpense(item);
        return res['success'] == true;
      } catch (_) {
        await _offlineSync.queueExpense(item);
        return true;
      }
    } else {
      await _offlineSync.queueExpense(item);
      return true;
    }
  }

  // Force Manual Offline Queue Sync
  Future<Map<String, dynamic>> forceSync() async {
    return _offlineSync.syncAll(_api);
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
