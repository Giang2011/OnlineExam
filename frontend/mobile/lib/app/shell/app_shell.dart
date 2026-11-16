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
    final secondary = AppNavigation.secondaryForRole(user.role);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= AppBreakpoints.railMinWidth;

        return Scaffold(
          appBar: isWide ? null : _buildAppBar(context, secondary),
          drawer: secondary.isEmpty ? null : _buildDrawer(context, secondary),
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

  PreferredSizeWidget _buildAppBar(
    BuildContext context,
    List<NavDestination> secondary,
  ) {
    final colors = context.examColors;

    return AppBar(
      title: Text(user.name),
      actions: [
        if (secondary.isNotEmpty)
          Builder(
            builder: (context) => IconButton(
              onPressed: Scaffold.of(context).openDrawer,
              icon: const Icon(Icons.menu),
              tooltip: 'Menu',
            ),
          ),
        IconButton(
          onPressed: () => context.go('/profile'),
          icon: const Icon(Icons.account_circle_outlined),
          tooltip: 'Hồ sơ',
        ),
      ],
      backgroundColor: colors.paperElevated,
    );
  }

  Widget _buildDrawer(BuildContext context, List<NavDestination> secondary) {
    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              child: Text(
                user.name,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const Divider(height: 1),
            for (final dest in secondary)
              ListTile(
                leading: Icon(dest.icon),
                title: Text(dest.label),
                onTap: () {
                  Navigator.of(context).pop();
                  context.go(dest.route);
                },
              ),
          ],
        ),
      ),
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
