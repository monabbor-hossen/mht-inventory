class DashboardSummary {
  final int totalStock;
  final int totalIn;
  final int totalOut;
  final int dispatchedToday;
  final double expensesToday;
  final int damagedStock;

  DashboardSummary({
    required this.totalStock,
    required this.totalIn,
    required this.totalOut,
    required this.dispatchedToday,
    required this.expensesToday,
    required this.damagedStock,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalStock: int.tryParse(json['totalStock']?.toString() ?? '0') ?? 0,
      totalIn: int.tryParse(json['totalIn']?.toString() ?? '0') ?? 0,
      totalOut: int.tryParse(json['totalOut']?.toString() ?? '0') ?? 0,
      dispatchedToday: int.tryParse(json['dispatchedToday']?.toString() ?? '0') ?? 0,
      expensesToday: double.tryParse(json['expensesToday']?.toString() ?? '0') ?? 0.0,
      damagedStock: int.tryParse(json['damagedStock']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'totalStock': totalStock,
    'totalIn': totalIn,
    'totalOut': totalOut,
    'dispatchedToday': dispatchedToday,
    'expensesToday': expensesToday,
    'damagedStock': damagedStock,
  };
}

class WeeklyFlowItem {
  final String day;
  final String date;
  final int stockIn;
  final int stockOut;

  WeeklyFlowItem({
    required this.day,
    required this.date,
    required this.stockIn,
    required this.stockOut,
  });

  factory WeeklyFlowItem.fromJson(Map<String, dynamic> json) {
    return WeeklyFlowItem(
      day: json['day']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      stockIn: int.tryParse(json['stockIn']?.toString() ?? '0') ?? 0,
      stockOut: int.tryParse(json['stockOut']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'day': day,
    'date': date,
    'stockIn': stockIn,
    'stockOut': stockOut,
  };
}

class InboundBatch {
  final int? id;
  final String batchNumber;
  final String supplierName;
  final String category;
  final String origin;
  final String challanNumber;
  final String productName;
  final int bagsCount;
  final String unitWeight;
  final double totalTonnes;
  final String warehouseZone;
  final String status;
  final String? receivedDate;
  final String? receivedTime;

  InboundBatch({
    this.id,
    required this.batchNumber,
    required this.supplierName,
    this.category = 'Grain & Rice',
    required this.origin,
    required this.challanNumber,
    required this.productName,
    required this.bagsCount,
    required this.unitWeight,
    required this.totalTonnes,
    required this.warehouseZone,
    this.status = 'Completed',
    this.receivedDate,
    this.receivedTime,
  });

  factory InboundBatch.fromJson(Map<String, dynamic> json) {
    final rawTonnes = json['total_tonnes'] ?? json['totalTonnes'] ?? 0;
    final rawBags = json['bags_count'] ?? json['bags'] ?? 0;

    return InboundBatch(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      batchNumber: json['batch_number']?.toString() ?? json['batch']?.toString() ?? '',
      supplierName: json['supplier_name']?.toString() ?? json['supplier']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Grain & Rice',
      origin: json['origin']?.toString() ?? 'Local',
      challanNumber: json['challan_number']?.toString() ?? json['challan']?.toString() ?? '',
      productName: json['product_name']?.toString() ?? json['product']?.toString() ?? '',
      bagsCount: int.tryParse(rawBags.toString()) ?? 0,
      unitWeight: json['unit_weight']?.toString() ?? json['weight']?.toString() ?? '25 Kg',
      totalTonnes: double.tryParse(rawTonnes.toString()) ?? 0.0,
      warehouseZone: json['warehouse_zone']?.toString() ?? json['zone']?.toString() ?? 'Zone A',
      status: json['status']?.toString() ?? 'Completed',
      receivedDate: json['received_date']?.toString(),
      receivedTime: json['received_time']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'batch_number': batchNumber,
    'supplier_name': supplierName,
    'category': category,
    'origin': origin,
    'challan_number': challanNumber,
    'product_name': productName,
    'bags_count': bagsCount,
    'unit_weight': unitWeight,
    'total_tonnes': totalTonnes,
    'warehouse_zone': warehouseZone,
    'status': status,
    'received_date': receivedDate,
    'received_time': receivedTime,
  };
}

class ScanItem {
  final int? id;
  final String scanKey;
  final String? barcode;
  final String batchNumber;
  final String productName;
  final int bags;
  final String unitWeight;
  final String warehouseZone;
  final String scannedBy;
  final String direction; // 'In', 'Out', 'Damaged'
  final String scanDate;
  final String scanTime;

  ScanItem({
    this.id,
    required this.scanKey,
    this.barcode,
    required this.batchNumber,
    required this.productName,
    required this.bags,
    required this.unitWeight,
    required this.warehouseZone,
    required this.scannedBy,
    required this.direction,
    required this.scanDate,
    required this.scanTime,
  });

  factory ScanItem.fromJson(Map<String, dynamic> json) {
    final rawBags = json['bags'] ?? 1;

    return ScanItem(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      scanKey: json['key']?.toString() ?? json['scan_key']?.toString() ?? '',
      barcode: json['barcode']?.toString() ?? json['barcode_uid']?.toString(),
      batchNumber: json['batch']?.toString() ?? json['batch_number']?.toString() ?? '',
      productName: json['product']?.toString() ?? json['product_name']?.toString() ?? '',
      bags: int.tryParse(rawBags.toString()) ?? 1,
      unitWeight: json['weight']?.toString() ?? json['unit_weight']?.toString() ?? '25 Kg',
      warehouseZone: json['zone']?.toString() ?? json['warehouse_zone']?.toString() ?? 'Zone A',
      scannedBy: json['by']?.toString() ?? json['scanned_by']?.toString() ?? 'Staff',
      direction: json['dir']?.toString() ?? json['direction']?.toString() ?? 'In',
      scanDate: json['date']?.toString() ?? json['scan_date']?.toString() ?? '',
      scanTime: json['time']?.toString() ?? json['scan_time']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'key': scanKey,
    'barcode': barcode,
    'batch': batchNumber,
    'product': productName,
    'bags': bags,
    'weight': unitWeight,
    'zone': warehouseZone,
    'by': scannedBy,
    'dir': direction,
    'date': scanDate,
    'time': scanTime,
  };
}

class DamageItem {
  final int? id;
  final String damageCode;
  final String? barcode;
  final String batchNumber;
  final String productName;
  final int bags;
  final String reason;
  final String reportedBy;
  final String? photoUrl;
  final String? notes;
  final String? damageDate;
  final String? damageTime;

  DamageItem({
    this.id,
    required this.damageCode,
    this.barcode,
    required this.batchNumber,
    required this.productName,
    required this.bags,
    required this.reason,
    required this.reportedBy,
    this.photoUrl,
    this.notes,
    this.damageDate,
    this.damageTime,
  });

  factory DamageItem.fromJson(Map<String, dynamic> json) {
    final rawBags = json['bags'] ?? 1;

    return DamageItem(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      damageCode: json['id_code']?.toString() ?? json['damage_code']?.toString() ?? json['id']?.toString() ?? '',
      barcode: json['barcode']?.toString() ?? json['barcode_uid']?.toString(),
      batchNumber: json['batch']?.toString() ?? json['batch_number']?.toString() ?? '',
      productName: json['product']?.toString() ?? json['product_name']?.toString() ?? '',
      bags: int.tryParse(rawBags.toString()) ?? 1,
      reason: json['reason']?.toString() ?? 'Torn Bag',
      reportedBy: json['by']?.toString() ?? json['reported_by']?.toString() ?? 'Staff',
      photoUrl: json['photoUrl']?.toString() ?? json['photo_url']?.toString(),
      notes: json['notes']?.toString(),
      damageDate: json['date']?.toString() ?? json['damage_date']?.toString(),
      damageTime: json['time']?.toString() ?? json['damage_time']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': damageCode,
    'barcode': barcode,
    'batch': batchNumber,
    'product': productName,
    'bags': bags,
    'reason': reason,
    'by': reportedBy,
    'photoUrl': photoUrl,
    'notes': notes,
    'date': damageDate,
    'time': damageTime,
  };
}

class ExpenseItem {
  final int? id;
  final String voucherNo;
  final String category;
  final double amount;
  final String date;
  final String time;
  final String note;
  final String? receiptUrl;
  final String enteredBy;

  ExpenseItem({
    this.id,
    required this.voucherNo,
    required this.category,
    required this.amount,
    required this.date,
    required this.time,
    required this.note,
    this.receiptUrl,
    required this.enteredBy,
  });

  factory ExpenseItem.fromJson(Map<String, dynamic> json) {
    final rawAmount = json['amount'] ?? 0;

    return ExpenseItem(
      id: json['id'] != null ? int.tryParse(json['id'].toString()) : null,
      voucherNo: json['voucherNo']?.toString() ?? json['voucher_no']?.toString() ?? '',
      category: json['cat']?.toString() ?? json['category']?.toString() ?? 'Others',
      amount: double.tryParse(rawAmount.toString()) ?? 0.0,
      date: json['date']?.toString() ?? json['expense_date']?.toString() ?? '',
      time: json['time']?.toString() ?? json['expense_time']?.toString() ?? '',
      note: json['note']?.toString() ?? '',
      receiptUrl: json['receiptUrl']?.toString() ?? json['receipt_url']?.toString(),
      enteredBy: json['enteredBy']?.toString() ?? json['entered_by']?.toString() ?? 'Staff',
    );
  }

  Map<String, dynamic> toJson() => {
    'voucherNo': voucherNo,
    'cat': category,
    'category': category,
    'amount': amount,
    'date': date,
    'time': time,
    'note': note,
    'receiptUrl': receiptUrl,
    'enteredBy': enteredBy,
  };
}
