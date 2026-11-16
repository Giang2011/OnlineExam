/// Cấu hình runtime của app.
abstract final class AppConfig {
  /// Base URL của backend.
  ///
  /// - Android emulator: `http://10.0.2.2:8080/api/v1` (`10.0.2.2` là host loopback).
  /// - Máy thật: dùng IP LAN của máy chạy backend.
  ///
  /// Override khi build: `--dart-define=API_BASE_URL=http://192.168.1.10:8080/api/v1`.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api/v1',
  );

  /// Gốc để dựng URL ảnh tĩnh (`/uploads/**`).
  static String get origin {
    final uri = Uri.parse(baseUrl);
    return '${uri.scheme}://${uri.authority}';
  }

  /// Khoảng thời gian giữa hai lần autosave lên server (giây).
  static const int autosaveIntervalSeconds = 20;

  /// Số giây còn lại để cảnh báo học sinh.
  static const int warningThresholdSeconds = 5 * 60;
}
