import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';

/// Quản lý cookie phiên `EXAMSESSION` (HttpOnly) và `XSRF-TOKEN` (đọc được).
///
/// Backend dùng cookie thay vì Bearer/JWT nên cookie jar phải **persist**:
/// người dùng kill app rồi mở lại vẫn phải còn phiên đăng nhập.
class SessionCookieManager {
  SessionCookieManager._(this._jar, this._apiOrigin);

  static const String csrfCookieName = 'XSRF-TOKEN';
  static const String csrfHeaderName = 'X-XSRF-TOKEN';

  /// Host giả để ghi cookie thủ công trong test.
  static final Uri _neutralUri = Uri.parse('http://cookie.local');

  final CookieJar _jar;

  /// Origin của API — cookie được lưu theo host nên phải đọc lại đúng host
  /// mới lấy được `XSRF-TOKEN`.
  final Uri _apiOrigin;

  /// Tạo jar persist trên đĩa. Gọi một lần lúc khởi động app.
  ///
  /// `FileStorage` nhận **thư mục** chứa cookie, không phải đường dẫn file.
  /// Nếu truyền đường dẫn file thì package sẽ cố tạo thư mục con bên trong
  /// file đó và mọi request đều fail với `CookieManagerLoadException`.
  static Future<SessionCookieManager> create({required String baseUrl}) async {
    final origin = Uri.parse(baseUrl);
    try {
      final dir = await getApplicationSupportDirectory();
      final jar = PersistCookieJar(storage: FileStorage(dir.path));
      // `init` là bất đồng bộ và chỉ chạy lần đầu — gọi sẵn để lỗi quyền ghi
      // lộ ra lúc khởi động thay vì giữa lúc đang làm bài.
      await jar.forceInit();
      return SessionCookieManager._(jar, origin);
    } catch (_) {
      // Không ghi được cookie xuống đĩa → dùng jar trong RAM để app vẫn chạy
      // được (chỉ mất phiên khi kill app).
      return SessionCookieManager._(CookieJar(), origin);
    }
  }

  /// Jar chỉ giữ trong RAM — dùng cho test.
  static SessionCookieManager inMemory() =>
      SessionCookieManager._(CookieJar(), _neutralUri);

  CookieJar get jar => _jar;

  /// Đọc CSRF token hiện tại. Cookie này cố tình **không** HttpOnly.
  ///
  /// `loadForRequest` là bất đồng bộ nên token được cache lại và làm mới
  /// mỗi lần đọc qua [refreshCsrfToken].
  String? getCsrfToken() => _csrfToken;

  String? _csrfToken;

  /// Nạp lại token từ jar — gọi trước khi gửi request ghi.
  Future<String?> refreshCsrfToken() async {
    try {
      final cookies = await _jar.loadForRequest(_apiOrigin);
      for (final cookie in cookies) {
        if (cookie.name == csrfCookieName) {
          _csrfToken = cookie.value;
          return _csrfToken;
        }
      }
    } catch (_) {
      // Jar lỗi → giữ token cache lần trước nếu có.
    }
    return _csrfToken;
  }

  /// Xoá toàn bộ cookie — dùng khi logout hoặc khi nhận 401.
  Future<void> clear() async {
    _csrfToken = null;
    await _jar.deleteAll();
  }

  /// Lưu cookie thủ công — dùng trong test để mô phỏng phiên đã đăng nhập.
  void setCookie(String name, String value) {
    _jar.saveFromResponse(_neutralUri, [
      Cookie(name, value),
    ]);
    if (name == csrfCookieName) _csrfToken = value;
  }
}
