import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import 'damages_screen.dart';

class ScansScreen extends StatefulWidget {
  const ScansScreen({super.key});

  @override
  State<ScansScreen> createState() => _ScansScreenState();
}

class _ScansScreenState extends State<ScansScreen> with SingleTickerProviderStateMixin {
  bool _flashlight = false;
  String _lens = 'Rear 1x';
  bool _flashingGreen = false;
  bool _flashingRed = false;
  late AnimationController _laserController;

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _laserController.dispose();
    super.dispose();
  }

  void _triggerFlash(bool success) {
    setState(() {
      if (success) {
        _flashingGreen = true;
      } else {
        _flashingRed = true;
      }
    });
    Future.delayed(Duration(milliseconds: success ? 220 : 380), () {
      if (mounted) {
        setState(() {
          _flashingGreen = false;
          _flashingRed = false;
        });
      }
    });
  }

  void _showDuplicateDialog(String batch, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.error_outline, color: Color(0xFFD32F2F), size: 28),
            SizedBox(width: 8),
            Text('Already Scanned!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFCDD2)),
              ),
              child: Text(
                message,
                style: const TextStyle(color: Color(0xFFC62828), fontSize: 13, height: 1.4),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'No additional stock has been deducted. Please inspect warehouse shelf or barcode label.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Continue Scanning'),
          ),
        ],
      ),
    );
  }

  void _showFifoDialog(Map<String, dynamic> fifoAlert, String batch) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Color(0xFFFF9800), size: 28),
            SizedBox(width: 8),
            Text('FIFO Dispatch Alert', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3E0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFE0B2)),
              ),
              child: Text(
                fifoAlert['message'] ?? 'An older batch of this commodity is still in stock.',
                style: const TextStyle(color: Color(0xFFE65100), fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Warehouse standard operating procedure mandates First-In, First-Out to avoid moisture and grain deterioration.',
              style: TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ],
        ),
        actions: [
          OutlinedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Switch to Older Batch'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Override & Dispatch'),
          ),
        ],
      ),
    );
  }

  void _handleSimulatedScan({String? customBatch}) async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final batch = customBatch ?? 'B-2610-${140 + Random().nextInt(850)}';

    final res = await provider.processScan(
      batchId: batch,
      bags: 1,
      zone: 'Zone A',
    );

    if (res['duplicate'] == true) {
      _triggerFlash(false);
      _showDuplicateDialog(batch, res['message'] ?? 'Batch already scanned.');
      return;
    }

    _triggerFlash(true);

    if (res['fifoAlert'] != null) {
      _showFifoDialog(res['fifoAlert'], batch);
    }

    if (provider.actionMode == 'Damage Mode') {
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => DamagesScreen(initialBatch: batch),
        ),
      );
    }
  }

  void _showManualScanModal() {
    final controller = TextEditingController(text: 'B-2610-');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
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
                const Text('Enter Batch / Barcode UID', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 8),
            const Text('Format: B-YYMM-NNN (e.g. B-2610-131)', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 16, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(
                labelText: 'Batch Number',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.qr_code),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
                    onPressed: () {
                      final val = controller.text.trim().toUpperCase();
                      if (val.isNotEmpty) {
                        Navigator.pop(ctx);
                        _handleSimulatedScan(customBatch: val);
                      }
                    },
                    child: const Text('Submit Scan'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF081012),
      body: Stack(
        children: [
          // Simulated Camera Live Background
          Positioned.fill(
            child: Opacity(
              opacity: 0.28,
              child: Image.network(
                'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1000&auto=format&fit=crop&q=80',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(color: Colors.black),
              ),
            ),
          ),

          // Green Pop Flash Overlay
          if (_flashingGreen)
            Positioned.fill(
              child: Container(
                color: const Color(0xFF388E3C).withValues(alpha: 0.38),
              ),
            ),

          // Red Screen Flash Overlay
          if (_flashingRed)
            Positioned.fill(
              child: Container(
                color: const Color(0xFFD32F2F).withValues(alpha: 0.48),
              ),
            ),

          // Top Header Controls
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Active Lens Indicator
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF00E676),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Camera: $_lens',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),

                      // Flashlight & Camera Switch
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => setState(() => _flashlight = !_flashlight),
                            icon: Icon(
                              _flashlight ? Icons.flash_on : Icons.flash_off,
                              color: _flashlight ? Colors.amber : Colors.white,
                            ),
                            style: IconButton.styleFrom(backgroundColor: Colors.black45),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _lens = _lens == 'Rear 1x' ? 'Front' : 'Rear 1x';
                              });
                            },
                            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                            style: IconButton.styleFrom(backgroundColor: Colors.black45),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Mode Toggle: Dispatch Mode vs Damage Mode
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white24),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => provider.setActionMode('Dispatch Mode'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: provider.actionMode == 'Dispatch Mode'
                                    ? const Color(0xFF005C4B)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Center(
                                child: Text(
                                  'Dispatch Mode',
                                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => provider.setActionMode('Damage Mode'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: provider.actionMode == 'Damage Mode'
                                    ? const Color(0xFFFF9800)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Center(
                                child: Text(
                                  'Damage Mode',
                                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Central Viewfinder Frame with animated laser
          Center(
            child: SizedBox(
              width: 260,
              height: 260,
              child: Stack(
                children: [
                  // Corner borders
                  Positioned(
                    left: 0,
                    top: 0,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        border: Border(
                          left: BorderSide(color: Color(0xFF00E676), width: 4),
                          top: BorderSide(color: Color(0xFF00E676), width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        border: Border(
                          right: BorderSide(color: Color(0xFF00E676), width: 4),
                          top: BorderSide(color: Color(0xFF00E676), width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    bottom: 0,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        border: Border(
                          left: BorderSide(color: Color(0xFF00E676), width: 4),
                          bottom: BorderSide(color: Color(0xFF00E676), width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        border: Border(
                          right: BorderSide(color: Color(0xFF00E676), width: 4),
                          bottom: BorderSide(color: Color(0xFF00E676), width: 4),
                        ),
                      ),
                    ),
                  ),

                  // Animated Green Laser
                  AnimatedBuilder(
                    animation: _laserController,
                    builder: (ctx, child) => Positioned(
                      top: _laserController.value * 250,
                      left: 8,
                      right: 8,
                      child: Container(
                        height: 2.5,
                        decoration: BoxDecoration(
                          color: const Color(0xFF00E676),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF00E676).withValues(alpha: 0.8),
                              blurRadius: 10,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Center instruction
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        provider.actionMode == 'Damage Mode'
                            ? 'Align Damaged Sack Barcode'
                            : 'Align Dispatch Barcode',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Session Scans Drawer & Quick Action Buttons
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFF8F9FA),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 16, offset: Offset(0, -4))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(height: 12),

                  // Session Counter & Offline status row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2EF),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.qr_code_scanner, color: Color(0xFF005C4B), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  'Session: ${provider.sessionScanCount} Bags',
                                  style: const TextStyle(
                                    color: Color(0xFF005C4B),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (!provider.isOnline)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFEBEE),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text('Offline Mode', style: TextStyle(color: Color(0xFFD32F2F), fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),

                      // Manual entry trigger
                      TextButton.icon(
                        onPressed: _showManualScanModal,
                        icon: const Icon(Icons.keyboard, size: 18),
                        label: const Text('Manual Entry'),
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF005C4B)),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Big Action Buttons for Continuous Scanning simulation
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF005C4B),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          onPressed: () => _handleSimulatedScan(),
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('Scan Next Bag', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          side: const BorderSide(color: Color(0xFFD32F2F)),
                        ),
                        onPressed: () {
                          // Simulate duplicate scan
                          if (provider.scans.isNotEmpty) {
                            _handleSimulatedScan(customBatch: provider.scans.first.batchNumber);
                          } else {
                            _handleSimulatedScan(customBatch: 'B-2610-131');
                          }
                        },
                        child: const Text('Test Duplicate', style: TextStyle(color: Color(0xFFD32F2F), fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
