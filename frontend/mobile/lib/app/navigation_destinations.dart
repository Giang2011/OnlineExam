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
/// Bottom navigation giới hạn **tối đa 5 mục** (quy tắc nav của
/// `ui-ux-pro-max`); các màn ít dùng được đưa vào drawer.
abstract final class AppNavigation {
  static List<NavDestination> forRole(Role role) {
    return switch (role) {
      Role.student => const [
        NavDestination(
          label: 'Kỳ thi',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: '/my-exams',
        ),
        NavDestination(
          label: 'Kết quả',
          icon: Icons.leaderboard_outlined,
          selectedIcon: Icons.leaderboard,
          route: '/my-results',
        ),
        NavDestination(
          label: 'Hồ sơ',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: '/profile',
        ),
      ],
      Role.teacher => const [
        NavDestination(
          label: 'Kỳ thi',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: '/exams',
        ),
        NavDestination(
          label: 'Câu hỏi',
          icon: Icons.help_outline,
          selectedIcon: Icons.help,
          route: '/questions',
        ),
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
      ],
      Role.admin => const [
        NavDestination(
          label: 'Kỳ thi',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: '/exams',
        ),
        NavDestination(
          label: 'Câu hỏi',
          icon: Icons.help_outline,
          selectedIcon: Icons.help,
          route: '/questions',
        ),
        NavDestination(
          label: 'Môn học',
          icon: Icons.folder_outlined,
          selectedIcon: Icons.folder,
          route: '/subjects',
        ),
        NavDestination(
          label: 'Tài khoản',
          icon: Icons.group_outlined,
          selectedIcon: Icons.group,
          route: '/users',
        ),
        NavDestination(
          label: 'Hồ sơ',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: '/profile',
        ),
      ],
    };
  }

  /// Các mục phụ (nằm trong drawer) — dùng ít thường xuyên hơn bottom nav.
  static List<NavDestination> secondaryForRole(Role role) {
    if (role == Role.student) return const [];

    return [
      if (role == Role.admin)
        const NavDestination(
          label: 'Đề giấy & OMR',
          icon: Icons.description_outlined,
          selectedIcon: Icons.description,
          route: '/paper-exams',
        ),
      if (role == Role.teacher)
        const NavDestination(
          label: 'Đề giấy & OMR',
          icon: Icons.description_outlined,
          selectedIcon: Icons.description,
          route: '/paper-exams',
        ),
      const NavDestination(
        label: 'Môn học & Chương',
        icon: Icons.folder_outlined,
        selectedIcon: Icons.folder,
        route: '/subjects',
      ),
      const NavDestination(
        label: 'Bảng điểm kỳ thi',
        icon: Icons.leaderboard_outlined,
        selectedIcon: Icons.leaderboard,
        route: '/results',
      ),
    ];
  }
}
