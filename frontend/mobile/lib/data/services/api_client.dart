import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';

import 'api_error.dart';
import 'session_cookie_manager.dart';

/// Client HTTP trung tâm — **mọi** request trong app đều đi qua đây.
///
/// Hợp đồng (rule `02-api-client.mdc`):
/// - Cookie phiên `EXAMSESSION` do `CookieManager` gắn tự động.
/// - Header `X-XSRF-TOKEN` cho method ghi.
/// - `401` → báo callback [onUnauthorized] (xoá session + về màn đăng nhập).
/// - `403` → **không** logout, **không** redirect.
class ApiClient {
  ApiClient({
    required SessionCookieManager cookies,
    required this.baseUrl,
    this.onUnauthorized,
  }) : _cookies = cookies {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 60),
        headers: const {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(CookieManager(cookies.jar));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (requiresCsrf(options.method)) {
            // Token có thể vừa được backend cấp lại → đọc lại từ jar.
            cookies.refreshCsrfToken().then((token) {
              if (token != null && token.isNotEmpty) {
                options.headers[SessionCookieManager.csrfHeaderName] = token;
              }
              handler.next(options);
            }).catchError((_) => handler.next(options));
            return;
          }
          handler.next(options);
        },
      ),
    );
  }

  /// Base URL của API, ví dụ `http://10.0.2.2:8080/api/v1`.
  final String baseUrl;
  final SessionCookieManager _cookies;

  /// Được gọi khi nhận 401 (trừ chính endpoint đăng nhập).
  void Function()? onUnauthorized;

  late final Dio _dio;

  Dio get raw => _dio;

  /// Cookie jar — dùng cho các trường hợp cần đọc cookie trực tiếp.
  SessionCookieManager get cookies => _cookies;

  /// Method này có cần header CSRF không.
  static bool requiresCsrf(String method) {
    const safe = {'GET', 'HEAD', 'OPTIONS'};
    return !safe.contains(method.toUpperCase());
  }

  /// Chạy một request và chuẩn hoá lỗi thành [ApiError].
  Future<T> _guard<T>(
    Future<T> Function() request, {
    bool skipUnauthorizedHandling = false,
  }) async {
    try {
      return await request();
    } on DioException catch (error) {
      // Log chi tiết để debug nhanh khi emulator không gọi được backend.
      debugPrint(
        'ApiClient ${error.requestOptions.method} '
        '${error.requestOptions.baseUrl}${error.requestOptions.path} '
        '-> ${error.type} (${error.message}) cause=${error.error}',
      );
      final apiError = _toApiError(error);
      // `/auth/login` trả 401 khi sai mật khẩu — không được coi là hết phiên.
      if (apiError.isUnauthorized && !skipUnauthorizedHandling) {
        onUnauthorized?.call();
      }
      throw apiError;
    }
  }

  /// Lấy message từ body lỗi của backend — hiển thị **nguyên văn** khi có thể.
  static String? extractMessage(Object? data) {
    if (data is Map) {
      final raw = data['message'];
      if (raw is String && raw.trim().isNotEmpty) return raw;
      final error = data['error'];
      if (error is String && error.trim().isNotEmpty) return error;
    }
    return null;
  }

  /// Chuyển lỗi Dio thành [ApiError] để tầng trên xử lý thống nhất.
  ApiError _toApiError(DioException error) {
    final response = error.response;
    final status = response?.statusCode ?? 0;
    final data = response?.data;

    var message = extractMessage(data);
    if (message == null && data is String && data.trim().isNotEmpty) {
      message = data;
    }

    return ApiError(
      status: status,
      message: message ?? defaultMessageFor(status, error),
      body: data,
    );
  }

  static String defaultMessageFor(int status, DioException error) {
    switch (status) {
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu.';
      case 413:
        return 'File tải lên vượt quá giới hạn cho phép (tối đa 10MB mỗi file, 15MB mỗi lần tải).';
      case 0:
        // Lỗi mạng: phân biệt timeout / không kết nối để thông báo rõ ràng.
        switch (error.type) {
          case DioExceptionType.connectionTimeout:
          case DioExceptionType.sendTimeout:
          case DioExceptionType.receiveTimeout:
            return 'Máy chủ không phản hồi. Kiểm tra kết nối mạng rồi thử lại.';
          case DioExceptionType.connectionError:
            return 'Không kết nối được tới máy chủ. Kiểm tra lại mạng.';
          case DioExceptionType.badCertificate:
            return 'Chứng chỉ bảo mật của máy chủ không hợp lệ.';
          case DioExceptionType.cancel:
            return 'Yêu cầu đã bị huỷ.';
          case DioExceptionType.badResponse:
          case DioExceptionType.unknown:
          case DioExceptionType.transformTimeout:
            return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        }
      default:
        return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    bool skipUnauthorizedHandling = false,
  }) {
    return _guard(
      () async {
        final response = await _dio.get<Object?>(path, queryParameters: query);
        return _decode<T>(response.data);
      },
      skipUnauthorizedHandling: skipUnauthorizedHandling,
    );
  }

  Future<T> post<T>(
    String path, {
    Object? body,
    bool skipUnauthorizedHandling = false,
  }) {
    return _guard(
      () async {
        final response = await _dio.post<Object?>(path, data: body);
        return _decode<T>(response.data);
      },
      skipUnauthorizedHandling: skipUnauthorizedHandling,
    );
  }

  Future<T> put<T>(String path, {Object? body}) {
    return _guard(() async {
      final response = await _dio.put<Object?>(path, data: body);
      return _decode<T>(response.data);
    });
  }

  Future<T> delete<T>(String path) {
    return _guard(() async {
      final response = await _dio.delete<Object?>(path);
      return _decode<T>(response.data);
    });
  }

  /// Upload multipart — **không** tự set `Content-Type` để client sinh boundary.
  Future<T> postMultipart<T>(String path, FormData formData) {
    return _guard(() async {
      final response = await _dio.post<Object?>(path, data: formData);
      return _decode<T>(response.data);
    });
  }

  Future<T> putMultipart<T>(String path, FormData formData) {
    return _guard(() async {
      final response = await _dio.put<Object?>(path, data: formData);
      return _decode<T>(response.data);
    });
  }

  /// Tải file nhị phân (PDF) — trả về byte.
  Future<List<int>> downloadBytes(
    String path, {
    Map<String, dynamic>? query,
  }) {
    return _guard(() async {
      final response = await _dio.get<List<int>>(
        path,
        queryParameters: query,
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data ?? const [];
    });
  }

  /// `204 No Content` → `null`; JSON → decode.
  T _decode<T>(Object? data) {
    if (data == null) return null as T;
    if (data is String) {
      if (data.isEmpty) return null as T;
      return jsonDecode(data) as T;
    }
    return data as T;
  }

  /// Xoá phiên cục bộ (dùng khi logout hoặc 401).
  Future<void> clearSession() => _cookies.clear();
}
