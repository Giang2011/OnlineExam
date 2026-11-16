/// Lỗi trả về từ backend — backend trả `{ status, message, timestamp }`.
///
/// Message từ backend được hiển thị **nguyên văn** khi có thể (rule `02-api-client.mdc`).
class ApiError implements Exception {
  ApiError({
    required this.status,
    required this.message,
    this.body,
  });

  final int status;
  final String message;
  final Object? body;

  /// 401 = chưa xác thực (phiên hết hạn).
  bool get isUnauthorized => status == 401;

  /// 403 = đã đăng nhập nhưng không đủ quyền.
  bool get isForbidden => status == 403;

  /// 413 = file vượt giới hạn upload.
  bool get isPayloadTooLarge => status == 413;

  @override
  String toString() => 'ApiError($status): $message';
}
