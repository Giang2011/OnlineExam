import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../../domain/models/app_user.dart';
import '../navigation_destinations.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Shell chứa navigation + nội dung.
///
/// Responsive theo **không gian sẵn có** (`LayoutBuilder`), không theo loại
/// thiết bị — vì Flutter app có thể chạy trong cửa sổ resize được.
class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.location,
    required this.user,
    required this.child,
  });

  final String location;
  final AppUser user;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final destinations = AppNavigation.forRole(user.role);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= AppBreakpoints.railMinWidth;

        return Scaffold(
          appBar: isWide ? null : _buildAppBar(context),
          body: SafeArea(
            top: isWide,
            bottom: !isWide,
            child: Row(
              children: [
                if (isWide) ...[
                  _NavigationRailSection(
                    destinations: destinations,
                    location: location,
                  ),
                  const VerticalDivider(width: 1),
                ],
                Expanded(
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxWidth: AppSpacing.contentMaxWidth,
                      ),
                      child: child,
                    ),
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: isWide
              ? null
              : NavigationBar(
                  selectedIndex: _selectedIndex(destinations),
                  onDestinationSelected: (index) =>
                      context.go(destinations[index].route),
                  destinations: [
                    for (final dest in destinations)
                      NavigationDestination(
                        icon: Icon(dest.icon),
                        selectedIcon: Icon(dest.selectedIcon),
                        label: dest.label,
                      ),
                  ],
                ),
        );
      },
    );
  }

  int _selectedIndex(List<NavDestination> destinations) {
    final index = destinations.indexWhere((d) => location.startsWith(d.route));
    return index < 0 ? 0 : index;
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    final colors = context.examColors;

    return AppBar(
      title: Text(user.name),
      actions: [
        IconButton(
          onPressed: () => context.go('/profile'),
          icon: const Icon(Icons.account_circle_outlined),
          tooltip: 'Hồ sơ',
        ),
      ],
      backgroundColor: colors.paperElevated,
    );
  }
}

/// Rail điều hướng cho màn hình rộng (tablet / cửa sổ lớn).
class _NavigationRailSection extends StatelessWidget {
  const _NavigationRailSection({
    required this.destinations,
    required this.location,
  });

  final List<NavDestination> destinations;
  final String location;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final selectedIndex = destinations.indexWhere(
      (d) => location.startsWith(d.route),
    );

    return NavigationRail(
      selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
      onDestinationSelected: (index) => context.go(destinations[index].route),
      backgroundColor: colors.paperElevated,
      labelType: NavigationRailLabelType.all,
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        child: Text(
          'Phòng\nThi',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.labelMedium,
        ),
      ),
      destinations: [
        for (final dest in destinations)
          NavigationRailDestination(
            icon: Icon(dest.icon),
            selectedIcon: Icon(dest.selectedIcon),
            label: Text(dest.label),
          ),
      ],
    );
  }
}
