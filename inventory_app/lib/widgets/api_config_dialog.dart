import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ApiConfigDialog extends StatefulWidget {
  const ApiConfigDialog({super.key});

  @override
  State<ApiConfigDialog> createState() => _ApiConfigDialogState();
}

class _ApiConfigDialogState extends State<ApiConfigDialog> {
  late TextEditingController _controller;
  final ApiService _api = ApiService();
  bool _testing = false;
  String? _testResult;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _api.baseUrl);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });

    final targetUrl = _controller.text.trim();
    final res = await _api.checkHealthForUrl(targetUrl);

    if (!mounted) return;

    setState(() {
      _testing = false;
      _isSuccess = res['success'] == true;
      if (_isSuccess) {
        _testResult = '✅ Connected! DB: ${res['mysql']?['serverVersion'] ?? 'Healthy'}';
      } else {
        _testResult = '❌ Failed: ${res['error'] ?? res['status'] ?? 'Unreachable'}';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.dns, color: Color(0xFF005C4B)),
          SizedBox(width: 8),
          Text('API Server Settings'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select or enter the Next.js API server URL:',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _controller,
              decoration: const InputDecoration(
                labelText: 'Base URL',
                hintText: 'https://mhtria.space',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.link),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.cloud_done, size: 16, color: Color(0xFF005C4B)),
                  label: const Text('Hostinger (Live)', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () => _controller.text = 'https://mhtria.space',
                ),
                ActionChip(
                  avatar: const Icon(Icons.computer, size: 16),
                  label: const Text('Localhost (3000)'),
                  onPressed: () => _controller.text = 'http://localhost:3000',
                ),
                ActionChip(
                  avatar: const Icon(Icons.phone_android, size: 16),
                  label: const Text('Android (10.0.2.2)'),
                  onPressed: () => _controller.text = 'http://10.0.2.2:3000',
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_testing)
              const Row(
                children: [
                  SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 10),
                  Text('Testing API connection...', style: TextStyle(fontSize: 12)),
                ],
              )
            else if (_testResult != null)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _isSuccess ? Colors.green.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: _isSuccess ? Colors.green : Colors.red),
                ),
                child: Text(
                  _testResult!,
                  style: TextStyle(fontSize: 12, color: _isSuccess ? Colors.green.shade800 : Colors.red.shade800),
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _testing ? null : _testConnection,
          child: const Text('Test Ping'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: const Color(0xFF005C4B)),
          onPressed: () {
            _api.setBaseUrl(_controller.text.trim());
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('API URL set to: ${_api.baseUrl}')),
            );
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}
