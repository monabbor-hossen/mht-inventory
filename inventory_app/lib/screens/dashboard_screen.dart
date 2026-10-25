import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int)? onNavigate;
  const DashboardScreen({super.key, this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  bool _loading = true;
  String? _error;
  DashboardSummary? _summary;
  List<WeeklyFlowItem> _weeklyFlow = [];
  List<ScanItem> _recentScans = [];
  bool _dbHealthy = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final health = await _api.checkHealth();
      final isHealthy = health['success'] == true && health['mysql']?['connected'] == true;

      final data = await _api.fetchDashboard();
      if (mounted) {
        setState(() {
          _dbHealthy = isHealthy;
          _summary = data['summary'];
          _weeklyFlow = data['weeklyFlow'];
          _recentScans = data['recentScans'];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF005C4B),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF005C4B)))
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.cloud_off, size: 54, color: Colors.redAccent),
                          const SizedBox(height: 12),
                          const Text(
                            'Cannot Connect to Inventory API',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: Colors.black54),
                          ),
                          const SizedBox(height: 16),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
                            onPressed: _loadData,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Server Health Indicator
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: _dbHealthy ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _dbHealthy ? const Color(0xFF81C784) : const Color(0xFFE57373),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _dbHealthy ? Icons.check_circle : Icons.error,
                              color: _dbHealthy ? const Color(0xFF2E7D32) : const Color(0xFFC62828),
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _dbHealthy
                                    ? 'Connected to MySQL: ${_api.baseUrl}'
                                    : 'Database issue on ${_api.baseUrl}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: _dbHealthy ? const Color(0xFF2E7D32) : const Color(0xFFC62828),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // KPI Cards Grid
                      if (_summary != null) ...[
                        Row(
                          children: [
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Total Stock',
                                value: '${_summary!.totalStock} Bags',
                                icon: Icons.inventory_2,
                                color: const Color(0xFF005C4B),
                                bg: const Color(0xFFE0F2F1),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Dispatched Today',
                                value: '${_summary!.dispatchedToday} Bags',
                                icon: Icons.local_shipping,
                                color: const Color(0xFF1976D2),
                                bg: const Color(0xFFE3F2FD),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Damaged Stock',
                                value: '${_summary!.damagedStock} Bags',
                                icon: Icons.warning_amber_rounded,
                                color: const Color(0xFFD32F2F),
                                bg: const Color(0xFFFFEBEE),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildMetricCard(
                                title: 'Expenses Today',
                                value: '৳${_summary!.expensesToday.toStringAsFixed(0)}',
                                icon: Icons.receipt_long,
                                color: const Color(0xFFF57C00),
                                bg: const Color(0xFFFFF3E0),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 24),

                      // Quick Action Buttons
                      const Text(
                        'Quick Operations',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildQuickActionButton(
                            label: 'Inbound',
                            icon: Icons.add_box,
                            onTap: () => widget.onNavigate?.call(1),
                          ),
                          _buildQuickActionButton(
                            label: 'Scan Out',
                            icon: Icons.qr_code_scanner,
                            onTap: () => widget.onNavigate?.call(2),
                          ),
                          _buildQuickActionButton(
                            label: 'Expenses',
                            icon: Icons.account_balance_wallet,
                            onTap: () => widget.onNavigate?.call(3),
                          ),
                          _buildQuickActionButton(
                            label: 'Damages',
                            icon: Icons.report_problem,
                            onTap: () => widget.onNavigate?.call(4),
                          ),
                        ],
                      ),
                      // 7-Day Flow Bar Visualizer
                      if (_weeklyFlow.isNotEmpty) ...[
                        const Text(
                          '7-Day Flow (In vs Out)',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _weeklyFlow.map((day) {
                              return Container(
                                width: 72,
                                margin: const EdgeInsets.only(right: 8),
                                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: Column(
                                  children: [
                                    Text(day.day, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    Text(day.date, style: const TextStyle(fontSize: 10, color: Colors.black45)),
                                    const SizedBox(height: 8),
                                    Text('↓ ${day.stockIn}', style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                                    Text('↑ ${day.stockOut}', style: const TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      if (_recentScans.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Center(
                            child: Text(
                              'No recent scan movements recorded.',
                              style: TextStyle(color: Colors.black45),
                            ),
                          ),
                        )
                      else
                        ..._recentScans.map((scan) => Card(
                              elevation: 0,
                              margin: const EdgeInsets.only(bottom: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: BorderSide(color: Colors.grey.shade200),
                              ),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: scan.direction == 'In'
                                      ? Colors.green.shade50
                                      : scan.direction == 'Out'
                                          ? Colors.blue.shade50
                                          : Colors.red.shade50,
                                  child: Icon(
                                    scan.direction == 'In'
                                        ? Icons.arrow_downward
                                        : scan.direction == 'Out'
                                            ? Icons.arrow_upward
                                            : Icons.warning,
                                    color: scan.direction == 'In'
                                        ? Colors.green
                                        : scan.direction == 'Out'
                                            ? Colors.blue
                                            : Colors.red,
                                    size: 18,
                                  ),
                                ),
                                title: Text(
                                  scan.productName,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                                subtitle: Text(
                                  'Batch: ${scan.batchNumber} · ${scan.warehouseZone}',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${scan.bags} Bags',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: scan.direction == 'In'
                                            ? Colors.green.shade700
                                            : scan.direction == 'Out'
                                                ? Colors.blue.shade700
                                                : Colors.red.shade700,
                                      ),
                                    ),
                                    Text(
                                      scan.scanTime,
                                      style: const TextStyle(fontSize: 11, color: Colors.black45),
                                    ),
                                  ],
                                ),
                              ),
                            )),
                    ],
                  ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFF005C4B).withValues(alpha: 0.1),
                child: Icon(icon, color: const Color(0xFF005C4B), size: 20),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
