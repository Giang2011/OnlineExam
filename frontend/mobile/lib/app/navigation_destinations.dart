import 'package:material_ui/material_ui.dart';

import '../domain/models/app_user.dart';

/// Một mục điều hướng trong shell.
class NavDestination {
  const NavDestination({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final String route;
}

/// Danh sách mục điều hướng theo vai trò.
///
/// App mobile chỉ phục vụ paper exam nên giáo viên và quản trị viên có cùng
/// một bộ mục: đề giấy & OMR, hồ sơ.
abstract final class AppNavigation {
  static List<NavDestination> forRole(Role role) {
    return const [
      NavDestination(
        label: 'Đề giấy',
        icon: Icons.description_outlined,
        selectedIcon: Icons.description,
        route: '/paper-exams',
      ),
      NavDestination(
        label: 'Hồ sơ',
        icon: Icons.person_outline,
        selectedIcon: Icons.person,
        route: '/profile',
      ),
    ];
  }

  /// Các mục phụ (nằm trong drawer) — hiện không có mục nào.
  static List<NavDestination> secondaryForRole(Role role) => const [];
}
