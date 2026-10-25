import 'dart:math';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class InboundScreen extends StatefulWidget {
  const InboundScreen({super.key});

  @override
  State<InboundScreen> createState() => _InboundScreenState();
}

class _InboundScreenState extends State<InboundScreen> {
  final ApiService _api = ApiService();
  bool _loading = true;
  String? _error;
  List<InboundBatch> _batches = [];
  String _searchQuery = '';
  String _statusFilter = 'All'; // 'All', 'Draft', 'Completed'

  @override
  void initState() {
    super.initState();
    _loadBatches();
  }

  Future<void> _loadBatches() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final batches = await _api.fetchInboundBatches();
      if (mounted) {
        setState(() {
          _batches = batches;
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

  // 1. Advance / Pre-planned Entry Modal
  void _showAdvanceEntryModal() {
    final batchController = TextEditingController(text: 'B-2610-${Random().nextInt(900) + 100}');
    final supplierController = TextEditingController(text: 'Nabil Auto Flour & Rice Mills');
    final challanController = TextEditingController(text: 'CHL-DHK-${Random().nextInt(9000) + 1000}');
    final productController = TextEditingController(text: 'Miniket Premium 25 Kg');
    final bagsController = TextEditingController(text: '350');
    final receiverController = TextEditingController(text: 'Kamal H. (Manager)');
    String origin = 'Local';
    String category = 'Rice & Grain';
    String unitWeight = '25 Kg';
    String zone = 'Zone A';

    final categories = ['Rice & Grain', 'Flour & Atta', 'Lentils & Pulses', 'Edible Oils', 'Spices & Commodities'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('📥 Advance Inbound Stock', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: batchController,
                        decoration: const InputDecoration(labelText: 'Batch No *', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: challanController,
                        decoration: const InputDecoration(labelText: 'Challan / LC *', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: supplierController,
                  decoration: const InputDecoration(labelText: 'Supplier Name *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: productController,
                        decoration: const InputDecoration(labelText: 'Product Name *', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: category,
                        decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder(), isDense: true),
                        items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                        onChanged: (v) => setModalState(() => category = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: bagsController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Bags Count *', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: unitWeight,
                        decoration: const InputDecoration(labelText: 'Unit Weight', border: OutlineInputBorder(), isDense: true),
                        items: ['25 Kg', '50 Kg', 'Custom']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12))))
                            .toList(),
                        onChanged: (v) => setModalState(() => unitWeight = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: origin,
                        decoration: const InputDecoration(labelText: 'Origin', border: OutlineInputBorder(), isDense: true),
                        items: ['Local', 'Middle East', 'Others']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12))))
                            .toList(),
                        onChanged: (v) => setModalState(() => origin = v!),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: zone,
                        decoration: const InputDecoration(labelText: 'Zone', border: OutlineInputBorder(), isDense: true),
                        items: ['Zone A', 'Zone B', 'Floor-1', 'Floor-2']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12))))
                            .toList(),
                        onChanged: (v) => setModalState(() => zone = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: receiverController,
                  decoration: const InputDecoration(labelText: 'Received By', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
                    icon: const Icon(Icons.print),
                    label: const Text('Save Batch & Generate Barcodes', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      if (batchController.text.trim().isEmpty || bagsController.text.trim().isEmpty) return;

                      final bags = int.tryParse(bagsController.text.trim()) ?? 0;
                      final payload = {
                        'mode': 'advance',
                        'batch': batchController.text.trim(),
                        'supplier': supplierController.text.trim(),
                        'origin': origin,
                        'category': category,
                        'challan': challanController.text.trim(),
                        'product': productController.text.trim(),
                        'bags': bags,
                        'unitWeight': unitWeight,
                        'zone': zone,
                        'receivedBy': receiverController.text.trim(),
                      };

                      final messenger = ScaffoldMessenger.of(context);
                      final nav = Navigator.of(ctx);

                      try {
                        await _api.createInboundBatch(payload);
                        if (!mounted) return;
                        nav.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text('✅ Batch ${batchController.text} created with $bags barcodes!'),
                            backgroundColor: const Color(0xFF005C4B),
                          ),
                        );
                        _loadBatches();
                      } catch (e) {
                        if (!mounted) return;
                        messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // 2. Blind Receipt & Quick Print Modal
  void _showBlindReceiptModal() {
    final qtyController = TextEditingController(text: '100');
    final batchId = 'BATCH-TEMP-${Random().nextInt(900) + 100}';
    String zone = 'Zone A';
    String weight = '25 Kg';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('⚡ Blind Receipt & Quick Print', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Color(0xFFE65100), size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'For emergency unannounced arrivals. Creates draft barcodes instantly. Actual supplier metadata can be bound later.',
                        style: TextStyle(fontSize: 12, color: Color(0xFFE65100)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: qtyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Quantity (Bags) *', border: OutlineInputBorder(), isDense: true),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      isExpanded: true,
                      initialValue: weight,
                      decoration: const InputDecoration(labelText: 'Unit Weight', border: OutlineInputBorder(), isDense: true),
                      items: ['25 Kg', '50 Kg']
                          .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12))))
                          .toList(),
                      onChanged: (v) => setModalState(() => weight = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: zone,
                decoration: const InputDecoration(labelText: 'Warehouse Zone', border: OutlineInputBorder(), isDense: true),
                items: ['Zone A', 'Zone B', 'Floor-1', 'Floor-2']
                    .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 12))))
                    .toList(),
                onChanged: (v) => setModalState(() => zone = v!),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFFFF9800)),
                  icon: const Icon(Icons.bolt),
                  label: const Text('Generate Draft Barcodes (Instant)', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    final qty = int.tryParse(qtyController.text.trim()) ?? 0;
                    if (qty <= 0) return;

                    final messenger = ScaffoldMessenger.of(context);
                    final nav = Navigator.of(ctx);

                    try {
                      final res = await _api.createBlindReceipt(
                        bags: qty,
                        batchNumber: batchId,
                        unitWeight: weight,
                        zone: zone,
                      );
                      if (!mounted) return;
                      nav.pop();
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(res['message'] ?? 'Created draft batch $batchId ($qty stickers)'),
                          backgroundColor: const Color(0xFFFF9800),
                        ),
                      );
                      _loadBatches();
                    } catch (e) {
                      if (!mounted) return;
                      messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 3. Late Metadata Binding Modal
  void _showLateBindingModal(InboundBatch batch) {
    final supplierController = TextEditingController(text: batch.supplierName == 'Pending Binding' ? '' : batch.supplierName);
    final productController = TextEditingController(text: batch.productName == 'Unassigned Inbound Cargo' ? '' : batch.productName);
    final challanController = TextEditingController(text: batch.challanNumber.startsWith('TEMP-') ? '' : batch.challanNumber);
    String category = 'Rice & Grain';
    final categories = ['Rice & Grain', 'Flour & Atta', 'Lentils & Pulses', 'Edible Oils', 'Spices & Commodities'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('🔗 Bind Metadata to ${batch.batchNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Assign real supplier and product info. All associated scanned barcodes will auto-cascade in MySQL.', style: TextStyle(fontSize: 12, color: Colors.black54)),
                const SizedBox(height: 12),
                TextField(
                  controller: supplierController,
                  decoration: const InputDecoration(labelText: 'Actual Supplier Name *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: category,
                  decoration: const InputDecoration(labelText: 'Category *', border: OutlineInputBorder(), isDense: true),
                  items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                  onChanged: (v) => setDialogState(() => category = v!),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: productController,
                  decoration: const InputDecoration(labelText: 'Commodity / Product Name *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: challanController,
                  decoration: const InputDecoration(labelText: 'Official Challan / LC No *', border: OutlineInputBorder(), isDense: true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
              icon: const Icon(Icons.check),
              label: const Text('Bind & Complete Batch'),
              onPressed: () async {
                if (supplierController.text.trim().isEmpty || productController.text.trim().isEmpty) return;

                final messenger = ScaffoldMessenger.of(context);
                final nav = Navigator.of(ctx);

                try {
                  final res = await _api.bindBatchMetadata(
                    batchNumber: batch.batchNumber,
                    supplier: supplierController.text.trim(),
                    category: category,
                    product: productController.text.trim(),
                    challan: challanController.text.trim(),
                  );
                  if (!mounted) return;
                  nav.pop();
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(res['message'] ?? 'Successfully bound metadata! Batch completed.'),
                      backgroundColor: const Color(0xFF005C4B),
                    ),
                  );
                  _loadBatches();
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  // 4. Dynamic Batch Adjustment Modal (+10 to print more, -5 to void)
  void _showAdjustModal(InboundBatch batch) {
    int delta = 10;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Adjust Batch ${batch.batchNumber}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Bag Count: ${batch.bagsCount} Bags', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              const Text('If actual physical bags differ from printed barcodes, adjust the count to print additional stickers or void excess barcodes.', style: TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: Colors.red.shade100, foregroundColor: Colors.red),
                    icon: const Icon(Icons.remove),
                    onPressed: () => setDialogState(() => delta -= 5),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    '${delta > 0 ? '+' : ''}$delta Bags',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: delta > 0 ? const Color(0xFF005C4B) : Colors.red,
                    ),
                  ),
                  const SizedBox(width: 16),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: Colors.green.shade100, foregroundColor: const Color(0xFF005C4B)),
                    icon: const Icon(Icons.add),
                    onPressed: () => setDialogState(() => delta += 5),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'New Total: ${max(0, batch.bagsCount + delta)} Bags',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
              onPressed: () async {
                if (delta == 0) return;
                final messenger = ScaffoldMessenger.of(context);
                final nav = Navigator.of(ctx);

                try {
                  final res = await _api.adjustBatchQuantity(
                    batchNumber: batch.batchNumber,
                    delta: delta,
                  );
                  if (!mounted) return;
                  nav.pop();
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(res['message'] ?? 'Adjusted batch quantity!'),
                      backgroundColor: const Color(0xFF005C4B),
                    ),
                  );
                  _loadBatches();
                } catch (e) {
                  if (!mounted) return;
                  messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              },
              child: const Text('Confirm Adjustment'),
            ),
          ],
        ),
      ),
    );
  }

  // 5. TSC Thermal Print Simulation Dialog
  void _showTscPrintModal(InboundBatch batch) {
    String printer = 'TSC TE244 via Network (192.168.1.45:9100)';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.print, color: Color(0xFF005C4B)),
            SizedBox(width: 8),
            Text('TSC Thermal Print', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Batch: ${batch.batchNumber}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('Quantity: ${batch.bagsCount} Labels (2" x 1" roll)'),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: printer,
              decoration: const InputDecoration(labelText: 'Select Thermal Printer', border: OutlineInputBorder(), isDense: true),
              items: [
                'TSC TE244 via Network (192.168.1.45:9100)',
                'TSC TE244 via USB (USB001 · Desk 1)',
                'TSC TTP-244 Pro (192.168.1.48)',
              ].map((p) => DropdownMenuItem(value: p, child: Text(p, style: const TextStyle(fontSize: 11)))).toList(),
              onChanged: (v) => printer = v!,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
                color: Colors.white,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('MHT GRAIN TRADING LTD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                  Text(batch.productName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  Text('UID: ${batch.batchNumber}-0001 · ${batch.warehouseZone}', style: const TextStyle(fontSize: 9, color: Colors.black54)),
                  const SizedBox(height: 6),
                  Center(
                    child: Container(
                      height: 28,
                      width: 140,
                      color: Colors.grey.shade200,
                      child: const Center(child: Text('||| | | |||| || | ||', style: TextStyle(fontSize: 14, letterSpacing: 2))),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
            icon: const Icon(Icons.print),
            label: const Text('Send to TSC'),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('🖨️ Sent ${batch.bagsCount} labels to $printer!'),
                  backgroundColor: const Color(0xFF005C4B),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _batches.where((b) {
      final q = _searchQuery.toLowerCase();
      final matchQuery = b.batchNumber.toLowerCase().contains(q) ||
          b.supplierName.toLowerCase().contains(q) ||
          b.productName.toLowerCase().contains(q) ||
          b.warehouseZone.toLowerCase().contains(q);

      final isDraft = b.batchNumber.contains('TEMP') || b.supplierName == 'Pending Binding';
      if (_statusFilter == 'Draft') return matchQuery && isDraft;
      if (_statusFilter == 'Completed') return matchQuery && !isDraft;
      return matchQuery;
    }).toList();

    return Scaffold(
      body: Column(
        children: [
          // Search & Filter Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search batch, supplier, product...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v),
                  ),
                ),
              ],
            ),
          ),

          // Status Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                FilterChip(
                  label: Text('All (${_batches.length})'),
                  selected: _statusFilter == 'All',
                  onSelected: (_) => setState(() => _statusFilter = 'All'),
                  selectedColor: const Color(0xFF005C4B).withValues(alpha: 0.15),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  avatar: const Icon(Icons.hourglass_top, size: 14, color: Color(0xFFFF9800)),
                  label: const Text('Drafts (Unbound)'),
                  selected: _statusFilter == 'Draft',
                  onSelected: (_) => setState(() => _statusFilter = 'Draft'),
                  selectedColor: const Color(0xFFFF9800).withValues(alpha: 0.15),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  avatar: const Icon(Icons.check_circle, size: 14, color: Color(0xFF005C4B)),
                  label: const Text('Completed'),
                  selected: _statusFilter == 'Completed',
                  onSelected: (_) => setState(() => _statusFilter = 'Completed'),
                  selectedColor: const Color(0xFF005C4B).withValues(alpha: 0.15),
                ),
              ],
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadBatches,
              color: const Color(0xFF005C4B),
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF005C4B)))
                  : _error != null
                      ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
                      : filtered.isEmpty
                          ? const Center(child: Text('No matching inbound shipments.'))
                          : ListView.builder(
                              padding: const EdgeInsets.all(12),
                              itemCount: filtered.length,
                              itemBuilder: (ctx, idx) {
                                final batch = filtered[idx];
                                final isDraft = batch.batchNumber.contains('TEMP') || batch.supplierName == 'Pending Binding';

                                return Card(
                                  elevation: 0,
                                  margin: const EdgeInsets.only(bottom: 10),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                    side: BorderSide(
                                      color: isDraft ? Colors.amber.shade300 : Colors.grey.shade200,
                                      width: isDraft ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: isDraft
                                                        ? const Color(0xFFFFF3E0)
                                                        : const Color(0xFF005C4B).withValues(alpha: 0.1),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    batch.batchNumber,
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      color: isDraft ? const Color(0xFFE65100) : const Color(0xFF005C4B),
                                                      fontFamily: 'monospace',
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: isDraft ? const Color(0xFFFFF3E0) : const Color(0xFFE8F5E9),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    isDraft ? 'DRAFT' : 'COMPLETED',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: isDraft ? const Color(0xFFE65100) : const Color(0xFF2E7D32),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Text(
                                              '${batch.bagsCount} Bags (${batch.totalTonnes} T)',
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          batch.productName,
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Supplier: ${batch.supplierName} (${batch.origin})',
                                          style: const TextStyle(fontSize: 12, color: Colors.black54),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.location_on, size: 14, color: Colors.black45),
                                                const SizedBox(width: 4),
                                                Text(batch.warehouseZone, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                                const SizedBox(width: 12),
                                                Text('Challan: ${batch.challanNumber}', style: const TextStyle(fontSize: 11, color: Colors.black45)),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const Divider(height: 20),
                                        // Action buttons: Bind (if draft), Adjust, Print
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            if (isDraft)
                                              TextButton.icon(
                                                style: TextButton.styleFrom(
                                                  foregroundColor: const Color(0xFFE65100),
                                                  visualDensity: VisualDensity.compact,
                                                ),
                                                icon: const Icon(Icons.link, size: 16),
                                                label: const Text('Bind Metadata', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                                onPressed: () => _showLateBindingModal(batch),
                                              ),
                                            TextButton.icon(
                                              style: TextButton.styleFrom(
                                                foregroundColor: const Color(0xFF005C4B),
                                                visualDensity: VisualDensity.compact,
                                              ),
                                              icon: const Icon(Icons.tune, size: 16),
                                              label: const Text('Adjust Qty', style: TextStyle(fontSize: 12)),
                                              onPressed: () => _showAdjustModal(batch),
                                            ),
                                            TextButton.icon(
                                              style: TextButton.styleFrom(
                                                foregroundColor: Colors.black87,
                                                visualDensity: VisualDensity.compact,
                                              ),
                                              icon: const Icon(Icons.print, size: 16),
                                              label: const Text('TSC Print', style: TextStyle(fontSize: 12)),
                                              onPressed: () => _showTscPrintModal(batch),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.small(
            heroTag: 'blind_inbound_btn',
            backgroundColor: const Color(0xFFFF9800),
            foregroundColor: Colors.white,
            onPressed: _showBlindReceiptModal,
            child: const Icon(Icons.bolt),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.extended(
            heroTag: 'advance_inbound_btn',
            backgroundColor: const Color(0xFF005C4B),
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add),
            label: const Text('Receive Batch'),
            onPressed: _showAdvanceEntryModal,
          ),
        ],
      ),
    );
  }
}
