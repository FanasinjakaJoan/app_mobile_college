import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'api_exception.dart';

/// Thin, testable wrapper around `package:http`.
///
/// Every transport failure is normalised into an [ApiException] so callers
/// never have to deal with platform-specific socket or XHR errors.
class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
      : _httpClient = httpClient ?? http.Client(),
        _baseUrl = baseUrl ?? ApiConfig.baseUrl;

  final http.Client _httpClient;
  final String _baseUrl;

  /// Performs `GET <baseUrl><path>` and returns the decoded JSON payload.
  Future<dynamic> getJson(String path) async {
    final http.Response response;
    try {
      response = await _httpClient
          .get(
            Uri.parse('$_baseUrl$path'),
            headers: const {'accept': 'application/json'},
          )
          .timeout(ApiConfig.requestTimeout);
    } on TimeoutException {
      throw const ApiException(ApiExceptionReason.timeout);
    } on http.ClientException catch (error) {
      // Covers DNS failures, refused connections and offline mode on both
      // mobile (dart:io) and web (XHR) implementations of package:http.
      throw ApiException(ApiExceptionReason.network, message: error.message);
    }
    return _decode(response);
  }

  void dispose() => _httpClient.close();

  dynamic _decode(http.Response response) {
    final status = response.statusCode;
    if (status == 404) {
      throw const ApiException(ApiExceptionReason.notFound);
    }
    if (status < 200 || status >= 300) {
      throw ApiException(
        ApiExceptionReason.server,
        statusCode: status,
        message: _serverMessage(response.body),
      );
    }
    if (response.body.trim().isEmpty) {
      return null;
    }
    try {
      return jsonDecode(response.body);
    } on FormatException {
      throw const ApiException(ApiExceptionReason.badResponse);
    }
  }

  /// Extracts `error.message` from the backend error envelope when present.
  String? _serverMessage(String body) {
    try {
      final dynamic decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final dynamic error = decoded['error'];
        if (error is Map<String, dynamic> && error['message'] is String) {
          return error['message'] as String;
        }
      }
    } on FormatException {
      // Non-JSON error body: fall through to the generic message.
    }
    return null;
  }
}
