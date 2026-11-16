import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/subject_view_models.dart';

/// Danh sách môn học.
class SubjectListView extends StatefulWidget {
  const SubjectListView({super.key});

  @override
  State<SubjectListView> createState() => _SubjectListViewState();
}

class _SubjectListViewState extends State<SubjectListView> {
  late final SubjectListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = SubjectListViewModel(context.read<SubjectRepository>());
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
              return const LoadingView(message: 'Đang tải môn học…');
            }
            if (_viewModel.errorMessage != null) {
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
                    title: 'Môn học',
                    description: 'Quản lý môn học và các chương bên trong.',
                    actions: [
                      FilledButton.icon(
                        onPressed: () => _openCreateDialog(context),
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm môn'),
                      ),
                    ],
                  ),
                  if (_viewModel.subjects.isEmpty)
                    const EmptyView(
                      title: 'Chưa có môn học',
                      description: 'Thêm môn học để bắt đầu soạn câu hỏi.',
                      icon: Icons.folder_outlined,
                    )
                  else
                    for (final subject in _viewModel.subjects)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: AppCard(
                          onTap: () => context.go('/subjects/${subject.id}'),
                          child: Row(
                            children: [
                              Icon(Icons.folder_outlined, color: colors.slate),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      subject.name,
                                      style: Theme.of(
                                        context,
                                      ).textTheme.titleSmall,
                                    ),
                                    Text(
                                      '${subject.chapters.length} chương',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                onPressed: () => _openEditDialog(
                                  context,
                                  subject.id,
                                  subject.name,
                                ),
                                icon: const Icon(Icons.edit_outlined),
                                tooltip: 'Sửa môn học',
                              ),
                              IconButton(
                                onPressed: () => _confirmDelete(subject.id, subject.name),
                                icon: const Icon(Icons.delete_outline),
                                tooltip: 'Xoá môn học',
                              ),
                            ],
                          ),
                        ),
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

  Future<void> _openCreateDialog(BuildContext context) async {
    final name = await showNameDialog(context, title: 'Thêm môn học');
    if (name == null) return;
    await _viewModel.create(name);
  }

  Future<void> _openEditDialog(
    BuildContext context,
    int id,
    String currentName,
  ) async {
    final name = await showNameDialog(
      context,
      title: 'Sửa môn học',
      initialValue: currentName,
    );
    if (name == null) return;
    await _viewModel.update(id, name);
  }

  Future<void> _confirmDelete(int id, String name) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Xoá môn học?',
      message:
          'Xoá "$name" sẽ xoá luôn các chương bên trong. Thao tác này không thể hoàn tác.',
      confirmLabel: 'Xoá',
      isDestructive: true,
    );

    if (confirmed) await _viewModel.delete(id);
  }
}
