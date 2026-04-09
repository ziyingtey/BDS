import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthApi {
  /// Must match `bds_backend/Properties/launchSettings.json` → `applicationUrl` HTTP port
  /// (default `http` profile uses **5062**, not 5207).
  static const int _devHttpPort = 5062;

  /// Full override, e.g. physical device: `--dart-define=API_BASE_URL=http://192.168.0.10:5062/api/auth`
  static String get _baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    // Android emulator: host machine loopback.
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:$_devHttpPort/api/auth';
    }
    if (kIsWeb) return 'http://localhost:$_devHttpPort/api/auth';
    return 'http://127.0.0.1:$_devHttpPort/api/auth';
  }

  static const Duration _timeout = Duration(seconds: 20);

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
  }) async {
    final response = await http
        .post(
          Uri.parse('${_baseUrl}/register'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'fullName': fullName,
            'email': email,
            'password': password,
            'role': role,
          }),
        )
        .timeout(
          _timeout,
          onTimeout: () => throw Exception(
            'Registration timed out. Run bds_backend on port $_devHttpPort (see launchSettings) and set API_BASE_URL on a real device.',
          ),
        );
    if (response.statusCode >= 400) {
      throw Exception(_messageFromBody(response.body, fallback: 'Registration failed'));
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http
        .post(
          Uri.parse('${_baseUrl}/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(
          _timeout,
          onTimeout: () => throw Exception(
            'Login timed out. Run bds_backend on port $_devHttpPort (see launchSettings) and set API_BASE_URL on a real device.',
          ),
        );
    if (response.statusCode >= 400) {
      throw Exception(_messageFromBody(response.body, fallback: 'Login failed'));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<void> deleteAccount({
    required String token,
    required String password,
  }) async {
    final response = await http
        .delete(
          Uri.parse('${_baseUrl}/delete-account'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'password': password}),
        )
        .timeout(
          _timeout,
          onTimeout: () => throw Exception(
            'Request timed out. Run bds_backend on port $_devHttpPort (see launchSettings) and set API_BASE_URL on a real device.',
          ),
        );
    if (response.statusCode >= 400) {
      throw Exception(_messageFromBody(response.body, fallback: 'Delete account failed'));
    }
  }

  /// ASP.NET returns `{ "message" }` for simple errors, but validation uses
  /// `{ "title", "errors": { "field": ["msg"] } }` — without this we only showed "Registration failed".
  String _messageFromBody(String body, {required String fallback}) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is! Map) return fallback;
      final map = Map<String, dynamic>.from(decoded);

      final message = map['message'];
      if (message is String && message.isNotEmpty) return message;

      final errors = map['errors'];
      if (errors is Map) {
        final lines = <String>[];
        for (final value in errors.values) {
          if (value is List) {
            for (final item in value) {
              if (item is String && item.isNotEmpty) lines.add(item);
            }
          } else if (value is String && value.isNotEmpty) {
            lines.add(value);
          }
        }
        if (lines.isNotEmpty) return lines.join(' ');
      }

      final title = map['title'];
      if (title is String && title.isNotEmpty) return title;

      final detail = map['detail'];
      if (detail is String && detail.isNotEmpty) return detail;
    } catch (_) {}

    final trimmed = body.trim();
    if (trimmed.isNotEmpty && trimmed.length < 400 && !trimmed.startsWith('<')) {
      return trimmed;
    }
    return fallback;
  }
}
