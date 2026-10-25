import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import 'api_service.dart';

enum SyncState { synced, syncing, offline }

class OfflineQueueItem {
  final String id;
  final String kind; // 'Scan', 'Damage', 'Expense'
  final Map<String, dynamic> payload;
  final String timestamp;

  OfflineQueueItem({
    required this.id,
    required this.kind,
    required this.payload,
    required this.timestamp,
  });

  factory OfflineQueueItem.fromJson(Map<String, dynamic> json) {
    return OfflineQueueItem(
      id: json['id']?.toString() ?? '',
      kind: json['kind']?.toString() ?? 'Scan',
      payload: Map<String, dynamic>.from(json['payload'] ?? {}),
      timestamp: json['timestamp']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'kind': kind,
    'payload': payload,
    'timestamp': timestamp,
  };
}

class OfflineSyncService extends ChangeNotifier {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  static const String _storageKey = 'mht_offline_queue_v1';
  List<OfflineQueueItem> _queue = [];
  SyncState _syncState = SyncState.synced;
  bool _initialized = false;

  List<OfflineQueueItem> get queue => List.unmodifiable(_queue);
  int get pendingCount => _queue.length;
  SyncState get syncState => _syncState;

  Future<void> init() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        final List decoded = jsonDecode(raw);
        _queue = decoded.map((e) => OfflineQueueItem.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Failed to load offline queue: $e');
    }
    _initialized = true;
    _syncState = _queue.isEmpty ? SyncState.synced : SyncState.offline;
    notifyListeners();
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = jsonEncode(_queue.map((e) => e.toJson()).toList());
      await prefs.setString(_storageKey, raw);
    } catch (e) {
      debugPrint('Failed to persist offline queue: $e');
    }
  }

  // Queue a scan when offline
  Future<void> queueScan(ScanItem scan) async {
    await init();
    final item = OfflineQueueItem(
      id: scan.scanKey,
      kind: 'Scan',
      payload: scan.toJson(),
      timestamp: DateTime.now().toIso8601String(),
    );
    _queue.add(item);
    _syncState = SyncState.offline;
    await _persist();
    notifyListeners();
  }

  // Queue damage when offline
  Future<void> queueDamage(DamageItem damage) async {
    await init();
    final item = OfflineQueueItem(
      id: damage.damageCode,
      kind: 'Damage',
      payload: damage.toJson(),
      timestamp: DateTime.now().toIso8601String(),
    );
    _queue.add(item);
    _syncState = SyncState.offline;
    await _persist();
    notifyListeners();
  }

  // Queue expense when offline
  Future<void> queueExpense(ExpenseItem expense) async {
    await init();
    final item = OfflineQueueItem(
      id: expense.voucherNo,
      kind: 'Expense',
      payload: expense.toJson(),
      timestamp: DateTime.now().toIso8601String(),
    );
    _queue.add(item);
    _syncState = SyncState.offline;
    await _persist();
    notifyListeners();
  }

  // Synchronize entire offline queue with Next.js MySQL REST API
  Future<Map<String, dynamic>> syncAll(ApiService api) async {
    await init();
    if (_queue.isEmpty) {
      _syncState = SyncState.synced;
      notifyListeners();
      return {'success': true, 'synced': 0, 'message': 'Queue is already empty.'};
    }

    _syncState = SyncState.syncing;
    notifyListeners();

    int successCount = 0;
    final List<OfflineQueueItem> failedItems = [];

    // Separate scan items to submit via batch sync if possible
    final scanItems = _queue.where((q) => q.kind == 'Scan').toList();
    final otherItems = _queue.where((q) => q.kind != 'Scan').toList();

    // 1. Sync Scans in Batch to /api/scan
    if (scanItems.isNotEmpty) {
      try {
        final payloadList = scanItems.map((s) => s.payload).toList();
        final res = await api.syncScanBatch(payloadList);
        if (res['success'] == true) {
          successCount += scanItems.length;
        } else {
          failedItems.addAll(scanItems);
        }
      } catch (e) {
        failedItems.addAll(scanItems);
      }
    }

    // 2. Sync Damages and Expenses individually
    for (final item in otherItems) {
      try {
        if (item.kind == 'Damage') {
          final res = await api.createDamage(DamageItem.fromJson(item.payload));
          if (res['success'] == true) {
            successCount++;
          } else {
            failedItems.add(item);
          }
        } else if (item.kind == 'Expense') {
          final res = await api.createExpense(ExpenseItem.fromJson(item.payload));
          if (res['success'] == true) {
            successCount++;
          } else {
            failedItems.add(item);
          }
        }
      } catch (e) {
        failedItems.add(item);
      }
    }

    _queue = failedItems;
    await _persist();

    _syncState = _queue.isEmpty ? SyncState.synced : SyncState.offline;
    notifyListeners();

    return {
      'success': failedItems.isEmpty,
      'synced': successCount,
      'remaining': _queue.length,
      'message': failedItems.isEmpty
          ? 'Successfully synced $successCount items to database.'
          : 'Synced $successCount items. ${_queue.length} items remain in offline queue.',
    };
  }

  Future<void> clearQueue() async {
    _queue.clear();
    await _persist();
    _syncState = SyncState.synced;
    notifyListeners();
  }
}
