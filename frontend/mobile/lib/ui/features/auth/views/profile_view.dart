import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/services/connectivity_service.dart';
import '../../../../domain/models/app_user.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../view_models/auth_view_model.dart';

/// Hồ sơ cá nhân — thông tin tài khoản, đổi mật khẩu, đăng xuất.
class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  bool _isEditing = false;
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final auth = context.watch<AuthViewModel>();
    final user = auth.user;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final canEditProfile = user.role != Role.student;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ'),
        actions: [
          if (canEditProfile)
            IconButton(
              onPressed: () => setState(() => _isEditing = !_isEditing),
              icon: Icon(_isEditing ? Icons.close : Icons.edit_outlined),
              tooltip: _isEditing ? 'Huỷ' : 'Sửa hồ sơ',
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          PageHeader(
            title: user.name,
            description: switch (user.role) {
              Role.admin => 'Quản trị viên',
              Role.teacher => 'Giáo viên',
              Role.student => 'Học sinh',
            },
          ),
          AppCard(
            child: Column(
              children: [
                _InfoRow(
                  label: 'Tên đăng nhập',
                  value: user.username,
                  icon: Icons.person_outline,
                ),
                if (user.studentId != null)
                  _InfoRow(
                    label: 'Mã học sinh',
                    value: user.studentId!,
                    icon: Icons.badge_outlined,
                  ),
                _InfoRow(
                  label: 'Vai trò',
                  value: user.role.wire,
                  icon: Icons.shield_outlined,
                ),
              ],
            ),
          ),
          if (_isEditing) ...[
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Đổi thông tin',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'Tên đăng nhập mới'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Họ tên mới'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Mật khẩu mới',
                helperText: 'Để trống nếu không muốn đổi mật khẩu.',
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: auth.isSubmitting ? null : () => _save(auth),
              child: const Text('Lưu thay đổi'),
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
          AppCard(
            child: ListenableBuilder(
              listenable: context.read<ConnectivityService>(),
              builder: (context, _) {
                final connectivity = context.read<ConnectivityService>();
                return Row(
                  children: [
                    Icon(
                      connectivity.isOnline
                          ? Icons.cloud_done_outlined
                          : Icons.cloud_off,
                      color: connectivity.isOnline ? colors.jade : colors.pen,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        connectivity.isOnline
                            ? 'Đang kết nối máy chủ'
                            : 'Mất mạng — đáp án sẽ được lưu cục bộ',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            onPressed: () => _handleLogout(auth),
            icon: const Icon(Icons.logout),
            label: const Text('Đăng xuất'),
            style: OutlinedButton.styleFrom(
              foregroundColor: colors.pen,
              side: BorderSide(color: colors.pen.withValues(alpha: 0.5)),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _save(AuthViewModel auth) async {
    final ok = await auth.updateProfile(
      username: _usernameController.text.trim(),
      password: _passwordController.text,
      name: _nameController.text.trim(),
    );

    if (!mounted) return;

    if (ok) {
      _usernameController.clear();
      _nameController.clear();
      _passwordController.clear();
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã cập nhật hồ sơ.')));
    } else if (auth.errorMessage != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(auth.errorMessage!)));
    }
  }

  Future<void> _handleLogout(AuthViewModel auth) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Đăng xuất?',
      message: 'Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.',
      confirmLabel: 'Đăng xuất',
    );

    if (!confirmed) return;
    await auth.logout();
    if (mounted) context.go('/login');
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colors.slate),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.labelSmall),
                Text(
                  value,
                  style: AppTypography.numeric(15, colors.ink),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
