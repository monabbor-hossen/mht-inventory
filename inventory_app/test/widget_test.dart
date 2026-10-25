import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:inventory_app/main.dart';
import 'package:inventory_app/providers/app_provider.dart';

void main() {
  testWidgets('MhtInventoryApp smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppProvider(),
        child: const MhtInventoryApp(),
      ),
    );

    // Initial frame should render the MaterialApp and Staff scanner interface
    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Continuous Batch Scanner'), findsOneWidget);
  });
}
