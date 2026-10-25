import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'Transport & Freight',
    'Labor & Wages',
    'Office & Warehouse',
    'Others',
  ];

  IconData _getCategoryIcon(String cat) {
    switch (cat) {
      case 'Transport & Freight':
        return Icons.local_shipping;
      case 'Labor & Wages':
        return Icons.engineering;
      case 'Office & Warehouse':
        return Icons.business;
      case 'Others':
      default:
        return Icons.local_cafe;
    }
  }

  Color _getCategoryColor(String cat) {
    switch (cat) {
      case 'Transport & Freight':
        return const Color(0xFF1976D2);
      case 'Labor & Wages':
        return const Color(0xFFE65100);
      case 'Office & Warehouse':
        return const Color(0xFF005C4B);
      case 'Others':
      default:
        return const Color(0xFF7B1FA2);
    }
  }

  void _showAddExpenseModal() {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final voucherController = TextEditingController(text: 'VCH-2610-${Random().nextInt(900) + 100}');
    final amountController = TextEditingController(text: '4500');
    final noteController = TextEditingController(text: 'Zone A truck unloading crew wages');
    String selectedCat = 'Labor & Wages';
    bool photoAttached = true;

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
                        Icon(Icons.receipt_long, color: Color(0xFF005C4B)),
                        SizedBox(width: 8),
                        Text('Add Expense / Petty Cash', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),

                // Category Dropdown
                DropdownButtonFormField<String>(
                  initialValue: selectedCat,
                  decoration: const InputDecoration(
                    labelText: 'Category *',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: _categories.map((c) {
                    return DropdownMenuItem(
                      value: c,
                      child: Row(
                        children: [
                          Icon(_getCategoryIcon(c), size: 18, color: _getCategoryColor(c)),
                          const SizedBox(width: 8),
                          Text(c, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (v) => setModalState(() => selectedCat = v!),
                ),
                const SizedBox(height: 12),

                // Amount in BDT
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    labelText: 'Amount (BDT) *',
                    prefixText: '৳ ',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),

                // Description
                TextField(
                  controller: noteController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description / Purpose *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),

                // Receipt Photo Memo
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(photoAttached ? Icons.check_circle : Icons.camera_alt,
                              color: photoAttached ? const Color(0xFF388E3C) : Colors.grey, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            photoAttached ? 'Paper Voucher Attached' : 'Attach Voucher Photo',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => setModalState(() => photoAttached = !photoAttached),
                        child: Text(photoAttached ? 'Remove' : 'Capture'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
                    onPressed: () async {
                      final amount = double.tryParse(amountController.text) ?? 0.0;
                      if (amount <= 0) return;

                      final now = DateTime.now();
                      final exp = ExpenseItem(
                        voucherNo: voucherController.text.trim(),
                        category: selectedCat,
                        amount: amount,
                        date: '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
                        time: '${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                        note: noteController.text.trim(),
                        receiptUrl: photoAttached ? 'https://images.unsplash.com/photo-1554415707-9e49016a3502?w=500' : null,
                        enteredBy: provider.userName,
                      );

                      final messenger = ScaffoldMessenger.of(context);
                      final nav = Navigator.of(ctx);

                      await provider.recordExpense(exp);
                      if (mounted) {
                        nav.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text('Saved ৳${amount.toStringAsFixed(0)} BDT to Daily Ledger'),
                            backgroundColor: const Color(0xFF005C4B),
                          ),
                        );
                      }
                    },
                    child: const Text('Save Expense Voucher', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
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
    final allExpenses = provider.expenses;

    // Filter
    final expenses = _selectedCategory == 'All'
        ? allExpenses
        : allExpenses.where((e) => e.category == _selectedCategory).toList();

    // Petty Cash calculations
    const assignedFund = 50000.0;
    final nowIso = DateTime.now().toIso8601String().substring(0, 10);
    final todaySpent = allExpenses
        .where((e) => e.date.startsWith(nowIso))
        .fold<double>(0.0, (sum, e) => sum + e.amount);
    final cashInHand = (assignedFund - todaySpent).clamp(0.0, 9999999.0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Accounts & Daily Ledger'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => provider.checkConnectivityAndRefresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF005C4B),
        foregroundColor: Colors.white,
        onPressed: _showAddExpenseModal,
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
      ),
      body: Column(
        children: [
          // Petty Cash Tracking Hero Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF005C4B), Color(0xFF003D32)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: const Color(0xFF005C4B).withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('PETTY CASH (DEPOT FUND)', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white12,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text('Fund: ৳${assignedFund.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 11)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Cash-in-Hand', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(
                          '৳${cashInHand.toStringAsFixed(0)} BDT',
                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text("Today's Spent", style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(
                          '৳${todaySpent.toStringAsFixed(0)}',
                          style: const TextStyle(color: Color(0xFFFFB74D), fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Category Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: _selectedCategory == 'All',
                  onSelected: (_) => setState(() => _selectedCategory = 'All'),
                  selectedColor: const Color(0xFF005C4B).withValues(alpha: 0.2),
                ),
                ..._categories.map((c) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: FilterChip(
                      avatar: Icon(_getCategoryIcon(c), size: 14, color: _getCategoryColor(c)),
                      label: Text(c),
                      selected: _selectedCategory == c,
                      onSelected: (_) => setState(() => _selectedCategory = c),
                      selectedColor: const Color(0xFF005C4B).withValues(alpha: 0.2),
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Expenses List
          Expanded(
            child: expenses.isEmpty
                ? const Center(child: Text('No expenses found for this category.'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: expenses.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (ctx, idx) {
                      final e = expenses[idx];
                      final color = _getCategoryColor(e.category);
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withValues(alpha: 0.12),
                            child: Icon(_getCategoryIcon(e.category), color: color, size: 20),
                          ),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(e.category, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              Text(
                                '৳${e.amount.toStringAsFixed(0)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF005C4B)),
                              ),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 2),
                              Text(e.note, style: const TextStyle(fontSize: 12, color: Colors.black87)),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('${e.date} · ${e.time}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  Text(e.enteredBy, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
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
}
