import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';

class DamagesScreen extends StatefulWidget {
  final String? initialBatch;
  const DamagesScreen({super.key, this.initialBatch});

  @override
  State<DamagesScreen> createState() => _DamagesScreenState();
}

class _DamagesScreenState extends State<DamagesScreen> {
  final List<String> _reasons = [
    'Torn Bag',
    'Moisture/Water Damage',
    'Weight Shortage',
    'Quality Issue',
  ];

  final List<String> _samplePhotos = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&h=360&fit=crop&auto=format',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialBatch != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showAddDamageModal(presetBatch: widget.initialBatch);
      });
    }
  }

  void _showAddDamageModal({String? presetBatch}) {
    final batchController = TextEditingController(text: presetBatch ?? 'B-2610-124');
    final productController = TextEditingController(text: 'Kataribhog Aromatic 25 Kg');
    final bagsController = TextEditingController(text: '4');
    final notesController = TextEditingController(text: 'Pallet hook tear during Zone A stack rotation');
    String selectedReason = 'Torn Bag';
    String? selectedPhotoUrl = _samplePhotos[0];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
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
                    Row(
                      children: const [
                        Icon(Icons.report_problem, color: Color(0xFFD32F2F)),
                        SizedBox(width: 8),
                        Text(
                          'File Damage & Return',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),

                // Batch Number & Reason
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: batchController,
                        style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold),
                        decoration: const InputDecoration(
                          labelText: 'Batch Number *',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 3,
                      child: DropdownButtonFormField<String>(
                        isExpanded: true,
                        initialValue: selectedReason,
                        decoration: const InputDecoration(
                          labelText: 'Reason *',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 12)))).toList(),
                        onChanged: (v) => setModalState(() => selectedReason = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Product & Quantity
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: productController,
                        decoration: const InputDecoration(
                          labelText: 'Product Name',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: bagsController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Damaged Bags *',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Photo Evidence Attachment
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.camera_alt, size: 16, color: Color(0xFF005C4B)),
                              SizedBox(width: 6),
                              Text('Photo Evidence Proof', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                selectedPhotoUrl = _samplePhotos[Random().nextInt(_samplePhotos.length)];
                              });
                            },
                            child: const Text('Capture / Retake'),
                          ),
                        ],
                      ),
                      if (selectedPhotoUrl != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            selectedPhotoUrl!,
                            height: 110,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              height: 60,
                              color: Colors.grey.shade300,
                              child: const Center(child: Text('Photo proof attached')),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Inspector Notes / QA Observations',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFD32F2F)),
                    onPressed: () async {
                      final batch = batchController.text.trim().toUpperCase();
                      final bags = int.tryParse(bagsController.text) ?? 1;
                      if (batch.isEmpty) return;

                      final provider = Provider.of<AppProvider>(context, listen: false);
                      final messenger = ScaffoldMessenger.of(context);
                      final nav = Navigator.of(ctx);
                      final now = DateTime.now();

                      final item = DamageItem(
                        damageCode: 'DMG-${Random().nextInt(900) + 100}',
                        batchNumber: batch,
                        productName: productController.text.trim(),
                        bags: bags,
                        reason: selectedReason,
                        reportedBy: provider.userName,
                        photoUrl: selectedPhotoUrl,
                        notes: notesController.text.trim(),
                        damageDate: '${now.day} ${_monthName(now.month)} ${now.year}',
                        damageTime: '${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                      );

                      await provider.recordDamage(item);
                      if (mounted) {
                        nav.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text('Logged $bags damaged bags under $selectedReason'),
                            backgroundColor: const Color(0xFFD32F2F),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Quarantine & Deduct Stock', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final damages = provider.damages;
    final totalDamaged = damages.fold<int>(0, (sum, d) => sum + d.bags);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Damage & Returns Ledger'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.checkConnectivityAndRefresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFD32F2F),
        foregroundColor: Colors.white,
        onPressed: () => _showAddDamageModal(),
        icon: const Icon(Icons.add),
        label: const Text('Report Damage'),
      ),
      body: Column(
        children: [
          // Hero Summary Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFEBEE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.dangerous, color: Color(0xFFD32F2F), size: 28),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Quarantined Stock', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                        Text(
                          '$totalDamaged Sacks',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFD32F2F)),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${damages.length} QA Reports',
                    style: const TextStyle(color: Color(0xFFFF9800), fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),

          // Damage Records List
          Expanded(
            child: damages.isEmpty
                ? const Center(child: Text('No damaged bags recorded yet.'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: damages.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (ctx, idx) {
                      final d = damages[idx];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Photo Thumbnail
                              if (d.photoUrl != null && d.photoUrl!.isNotEmpty)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    d.photoUrl!,
                                    width: 60,
                                    height: 60,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Container(
                                      width: 60,
                                      height: 60,
                                      color: const Color(0xFFFFEBEE),
                                      child: const Icon(Icons.broken_image, color: Color(0xFFD32F2F)),
                                    ),
                                  ),
                                )
                              else
                                Container(
                                  width: 60,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFEBEE),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.report, color: Color(0xFFD32F2F)),
                                ),

                              const SizedBox(width: 12),

                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          d.batchNumber,
                                          style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFEBEE),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            '${d.bags} Bags',
                                            style: const TextStyle(color: Color(0xFFD32F2F), fontWeight: FontWeight.bold, fontSize: 11),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(d.productName, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.amber.shade50,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: Colors.amber.shade200),
                                      ),
                                      child: Text(
                                        d.reason,
                                        style: TextStyle(color: Colors.amber.shade900, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    if (d.notes != null && d.notes!.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(d.notes!, style: const TextStyle(fontSize: 11, color: Colors.black87)),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
