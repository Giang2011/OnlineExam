import '../../domain/models/app_user.dart';
import '../services/api_client.dart';
import '../services/api_error.dart';

/// Repository xử lý đăng nhập / phiên / hồ sơ cá nhân.
class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  /// `POST /auth/login` — trả về user vừa đăng nhập.
  Future<AppUser> login({
    required String username,
    required String password,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      body: {'username': username, 'password': password},
      // Sai mật khẩu trả 401 — không được coi là hết phiên.
      skipUnauthorizedHandling: true,
    );

    final user = data['user'] as Map<String, dynamic>?;
    if (user == null) {
      throw ApiError(
        status: 500,
        message: 'Máy chủ trả về dữ liệu đăng nhập không hợp lệ.',
      );
    }
    return AppUser.fromJson(user);
  }

  /// `GET /auth/me` — khôi phục phiên sau khi app khởi động lại.
  ///
  /// Trả `null` khi chưa đăng nhập (401) — đây là trạng thái bình thường,
  /// không phải lỗi cần báo cho người dùng.
  Future<AppUser?> restoreSession() async {
    try {
      // 401 ở đây là bình thường (chưa đăng nhập) → không được coi là hết phiên.
      final data = await _api.get<Map<String, dynamic>>(
        '/auth/me',
        skipUnauthorizedHandling: true,
      );
      return AppUser.fromJson(data);
    } on ApiError catch (e) {
      if (e.isUnauthorized) return null;
      rethrow;
    }
  }

  /// `POST /auth/logout`.
  Future<void> logout() async {
    try {
      await _api.post<void>('/auth/logout');
    } on ApiError {
      // Backend bỏ qua CSRF cho logout; lỗi mạng không chặn việc xoá phiên cục bộ.
    } finally {
      await _api.clearSession();
    }
  }

  /// `PUT /users/me` — tự cập nhật (ADMIN và TEACHER).
  Future<AppUser> updateProfile({
    String? username,
    String? password,
    String? name,
  }) async {
    final body = <String, dynamic>{
      if (username != null && username.isNotEmpty) 'username': username,
      if (password != null && password.isNotEmpty) 'password': password,
      if (name != null && name.isNotEmpty) 'name': name,
    };

    final data = await _api.put<Map<String, dynamic>>('/users/me', body: body);
    return AppUser.fromJson(data);
  }
}
