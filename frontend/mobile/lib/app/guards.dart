import '../domain/models/app_user.dart';

/// Xác định route được phép truy cập theo vai trò.
///
/// App mobile chỉ phục vụ paper exam nên chỉ còn route dành cho giáo viên và
/// quản trị viên. Học sinh bị chặn ngay lúc đăng nhập (xem `AuthViewModel`).
abstract final class AppRouteGuard {
  /// Route dành riêng cho giáo viên và quản trị viên.
  static const Set<String> staffOnly = {
    '/paper-exams',
    '/profile',
  };

  /// Trả về đường dẫn cần chuyển hướng tới, hoặc `null` nếu được phép.
  static String? resolve({required String location, required AppUser? user}) {
    final isLogin = location == '/login';

    // Chưa đăng nhập → chỉ được vào màn đăng nhập.
    if (user == null) {
      return isLogin ? null : '/login';
    }

    // Đã đăng nhập → không ở lại màn đăng nhập.
    if (isLogin) return homeFor(user.role);

    // Route giáo viên / admin.
    if (staffOnly.any((prefix) => location.startsWith(prefix))) {
      return user.role.isStaff ? null : homeFor(user.role);
    }

    return null;
  }

  /// Trang chủ theo vai trò.
  static String homeFor(Role role) => '/paper-exams';
}
