import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService extends ChangeNotifier {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Configurable API base URL (defaults to localhost or hostinger)
  String _baseUrl = 'http://127.0.0.1:3000';

  String get baseUrl => _baseUrl;

  static String normalizeUrl(String url) {
    String trimmed = url.trim();
    if (trimmed.isEmpty) return 'http://127.0.0.1:3000';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'http://$trimmed';
    }
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }

  void setBaseUrl(String newUrl) {
    _baseUrl = normalizeUrl(newUrl);
    notifyListeners();
  }

  static const Map<String, String> _headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // 1. Health & Database Status
  Future<Map<String, dynamic>> checkHealth() async {
    return checkHealthForUrl(_baseUrl);
  }

  Future<Map<String, dynamic>> checkHealthForUrl(String url) async {
    final target = normalizeUrl(url);
    try {
      final res = await http.get(
        Uri.parse('$target/api/health'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      } else {
        return {'success': false, 'status': 'HTTP ${res.statusCode}', 'error': 'Server returned HTTP ${res.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'status': 'disconnected', 'error': e.toString()};
    }
  }

  // 2. Authentication Login
  Future<Map<String, dynamic>> login({
    required String user,
    required String pass,
    required String role,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/auth/login'),
        headers: _headers,
        body: jsonEncode({
          'user': user,
          'pass': pass,
          'role': role,
        }),
      ).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body);
      return json as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // 3. Fetch Dashboard Metrics
  Future<Map<String, dynamic>> fetchDashboard() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/dashboard'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        final data = json['data'];
        final summary = DashboardSummary.fromJson(data['summary'] ?? {});
        final flow = (data['weeklyFlow'] as List? ?? [])
            .map((e) => WeeklyFlowItem.fromJson(e))
            .toList();
        final recentScans = (data['recentActivity'] as List? ?? [])
            .map((e) => ScanItem.fromJson(e))
            .toList();
        return {
          'summary': summary,
          'weeklyFlow': flow,
          'recentScans': recentScans,
        };
      }
    }
    throw Exception('Failed to load dashboard data (HTTP ${res.statusCode})');
  }

  // 4. Inbound Batches: GET & POST
  Future<List<InboundBatch>> fetchInboundBatches() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/inventory?limit=50'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => InboundBatch.fromJson(item))
            .toList();
      }
    }
    throw Exception('Failed to load inbound batches (HTTP ${res.statusCode})');
  }

  Future<bool> createInboundBatch(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/inventory'),
      headers: _headers,
      body: jsonEncode(data),
    ).timeout(const Duration(seconds: 15));

    final json = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      return json['success'] == true;
    }
    throw Exception(json['error'] ?? 'Failed to create inbound batch');
  }

  // Blind Receipt & Quick Print
  Future<Map<String, dynamic>> createBlindReceipt({
    required int bags,
    String? batchNumber,
    String unitWeight = '25 Kg',
    String zone = 'Zone A',
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/inventory'),
      headers: _headers,
      body: jsonEncode({
        'mode': 'blind',
        'bags': bags,
        'batchNumber': batchNumber,
        'unitWeight': unitWeight,
        'zone': zone,
      }),
    ).timeout(const Duration(seconds: 15));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Dynamic Batch Adjustment (+N to print more, -N to void)
  Future<Map<String, dynamic>> adjustBatchQuantity({
    required String batchNumber,
    required int delta,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/inventory'),
      headers: _headers,
      body: jsonEncode({
        'mode': 'adjust',
        'batchNumber': batchNumber,
        'delta': delta,
      }),
    ).timeout(const Duration(seconds: 15));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Late Metadata Binding (Bind actual supplier, category, product to draft batch)
  Future<Map<String, dynamic>> bindBatchMetadata({
    required String batchNumber,
    required String supplier,
    required String category,
    required String product,
    required String challan,
    String? unitWeight,
    String? zone,
  }) async {
    final res = await http.put(
      Uri.parse('$_baseUrl/api/inventory'),
      headers: _headers,
      body: jsonEncode({
        'batchNumber': batchNumber,
        'supplier': supplier,
        'category': category,
        'product': product,
        'challan': challan,
        'unitWeight': unitWeight,
        'zone': zone,
      }),
    ).timeout(const Duration(seconds: 15));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // 5. Scans: GET & POST (with FIFO alert & Duplicate detection)
  Future<List<ScanItem>> fetchScans() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/scan?limit=50'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => ScanItem.fromJson(item))
            .toList();
      }
    }
    throw Exception('Failed to load scans (HTTP ${res.statusCode})');
  }

  // Record a scan with full response (handles duplicate & FIFO alert)
  Future<Map<String, dynamic>> postScan(dynamic scanData) async {
    final body = scanData is ScanItem ? scanData.toJson() : scanData;
    final res = await http.post(
      Uri.parse('$_baseUrl/api/scan'),
      headers: _headers,
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 10));

    final json = jsonDecode(res.body);
    return json as Map<String, dynamic>;
  }

  // Batch sync scans from offline queue
  Future<Map<String, dynamic>> syncScanBatch(List<Map<String, dynamic>> items) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/scan'),
      headers: _headers,
      body: jsonEncode(items),
    ).timeout(const Duration(seconds: 20));

    final json = jsonDecode(res.body);
    return json as Map<String, dynamic>;
  }

  // 6. Damages: GET & POST
  Future<List<DamageItem>> fetchDamages() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/damages?limit=50'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => DamageItem.fromJson(item))
            .toList();
      }
    }
    throw Exception('Failed to load damages (HTTP ${res.statusCode})');
  }

  Future<Map<String, dynamic>> createDamage(dynamic damageData) async {
    final body = damageData is DamageItem ? damageData.toJson() : damageData;
    final res = await http.post(
      Uri.parse('$_baseUrl/api/damages'),
      headers: _headers,
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 15));

    final json = jsonDecode(res.body);
    return json as Map<String, dynamic>;
  }

  // 7. Expenses: GET & POST & DELETE
  Future<List<ExpenseItem>> fetchExpenses() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/api/expenses?limit=50'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final json = jsonDecode(res.body);
      if (json['success'] == true && json['data'] != null) {
        return (json['data'] as List)
            .map((item) => ExpenseItem.fromJson(item))
            .toList();
      }
    }
    throw Exception('Failed to load expenses (HTTP ${res.statusCode})');
  }

  Future<Map<String, dynamic>> createExpense(dynamic expenseData) async {
    final body = expenseData is ExpenseItem ? expenseData.toJson() : expenseData;
    final res = await http.post(
      Uri.parse('$_baseUrl/api/expenses'),
      headers: _headers,
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 15));

    final json = jsonDecode(res.body);
    return json as Map<String, dynamic>;
  }

  Future<bool> deleteExpense(int id) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/api/expenses?id=$id&role=Super%20Admin'),
      headers: {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 15));

    final json = jsonDecode(res.body);
    if (res.statusCode == 200) {
      return json['success'] == true;
    }
    throw Exception(json['error'] ?? 'Failed to delete expense');
  }
}
