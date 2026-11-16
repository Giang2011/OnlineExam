import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/user_repository.dart';
import '../../../../domain/models/app_user.dart';
import '../../../../domain/models/question.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/user_list_view_model.dart';

/// Quản lý tài khoản — chỉ quản trị viên.
class UserListView extends StatefulWidget {
  const UserListView({super.key});

  @override
  State<UserListView> createState() => _UserListViewState();
}

class _UserListViewState extends State<UserListView> {
  late final UserListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = UserListViewModel(context.read<UserRepository>());
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: _viewModel,
          builder: (context, _) {
            if (_viewModel.isLoading) {
              return const LoadingView(message: 'Đang tải tài khoản…');
            }
            if (_viewModel.errorMessage != null &&
                _viewModel.users.isEmpty) {
              return ErrorView(
                message: _viewModel.errorMessage!,
                onRetry: _viewModel.load,
              );
            }

            return RefreshIndicator(
              onRefresh: _viewModel.load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  PageHeader(
                    title: 'Tài khoản',
                    description: '${_viewModel.users.length} tài khoản.',
                    actions: [
                      FilledButton.icon(
                        onPressed: _openCreateStudent,
                        icon: const Icon(Icons.person_add_alt),
                        label: const Text('Thêm học sinh'),
                      ),
                    ],
                  ),
                  if (_viewModel.lastCreated != null) ...[
                    _CredentialsCard(
                      credentials: _viewModel.lastCreated!,
                      onDismiss: _viewModel.clearLastCreated,
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  _UserSection(
                    title: 'Học sinh (${_viewModel.students.length})',
                    users: _viewModel.students,
                    onDelete: _viewModel.delete,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _UserSection(
                    title: 'Giáo viên (${_viewModel.teachers.length})',
                    users: _viewModel.teachers,
                    onDelete: _viewModel.delete,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _UserSection(
                    title: 'Quản trị (${_viewModel.admins.length})',
                    users: _viewModel.admins,
                    onDelete: _viewModel.delete,
                  ),
                ],
              ),
            );
          },
        ),
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _openCreateStudent() async {
    final result = await showModalBottomSheet<({String studentId, String name})>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => const _CreateStudentSheet(),
    );

    if (result == null) return;
    await _viewModel.createStudent(
      studentId: result.studentId,
      name: result.name,
    );
  }
}

class _CredentialsCard extends StatelessWidget {
  const _CredentialsCard({required this.credentials, required this.onDismiss});

  final CreatedCredentials credentials;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.jade.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: colors.jade.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.vpn_key_outlined, color: colors.jade),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Thông tin đăng nhập — chỉ hiển thị một lần',
                  style: theme.textTheme.titleSmall,
                ),
              ),
              IconButton(
                onPressed: onDismiss,
                icon: const Icon(Icons.close),
                tooltip: 'Đóng',
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _CredentialRow(label: 'Mã học sinh', value: credentials.studentId),
          _CredentialRow(label: 'Tên đăng nhập', value: credentials.username),
          _CredentialRow(label: 'Mật khẩu', value: credentials.password),
        ],
      ),
    );
  }
}

class _CredentialRow extends StatelessWidget {
  const _CredentialRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: theme.textTheme.bodySmall),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UserSection extends StatelessWidget {
  const _UserSection({
    required this.title,
    required this.users,
    required this.onDelete,
  });

  final String title;
  final List<AppUser> users;
  final Future<bool> Function(int) onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),
        if (users.isEmpty)
          Text(
            'Chưa có tài khoản.',
            style: Theme.of(context).textTheme.bodyMedium,
          )
        else
          for (final user in users)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: AppCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
                child: Row(
                  children: [
                    Icon(Icons.person_outline, color: colors.slate),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          Text(
                            user.studentId ?? user.username,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => _confirmDelete(context, user),
                      icon: const Icon(Icons.delete_outline),
                      tooltip: 'Xoá tài khoản',
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
  }

  Future<void> _confirmDelete(BuildContext context, AppUser user) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Xoá tài khoản?',
      message: 'Xoá tài khoản "${user.name}"? Thao tác này không thể hoàn tác.',
      confirmLabel: 'Xoá',
      isDestructive: true,
    );
    if (confirmed) await onDelete(user.id);
  }
}

class _CreateStudentSheet extends StatefulWidget {
  const _CreateStudentSheet();

  @override
  State<_CreateStudentSheet> createState() => _CreateStudentSheetState();
}

class _CreateStudentSheetState extends State<_CreateStudentSheet> {
  final _formKey = GlobalKey<FormState>();
  final _studentIdController = TextEditingController();
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _studentIdController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Thêm học sinh',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.lg),
            TextFormField(
              controller: _studentIdController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Mã học sinh'),
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? 'Vui lòng nhập mã học sinh.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Họ tên'),
              validator: (value) => (value == null || value.trim().isEmpty)
                  ? 'Vui lòng nhập họ tên.'
                  : null,
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: () {
                if (!(_formKey.currentState?.validate() ?? false)) return;
                Navigator.of(context).pop((
                  studentId: _studentIdController.text.trim(),
                  name: _nameController.text.trim(),
                ));
              },
              child: const Text('Tạo tài khoản'),
            ),
          ],
        ),
      ),
    );
  }
}
