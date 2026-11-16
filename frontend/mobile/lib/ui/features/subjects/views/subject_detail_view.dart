import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/subject_view_models.dart';

/// Chi tiết môn học — danh sách chương.
class SubjectDetailView extends StatefulWidget {
  const SubjectDetailView({super.key, required this.subjectId});

  final int subjectId;

  @override
  State<SubjectDetailView> createState() => _SubjectDetailViewState();
}

class _SubjectDetailViewState extends State<SubjectDetailView> {
  late final SubjectDetailViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = SubjectDetailViewModel(
      context.read<SubjectRepository>(),
      widget.subjectId,
    );
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: Text(_viewModel.subject?.name ?? 'Môn học')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải chương…');
          }
          if (_viewModel.errorMessage != null) {
            return ErrorView(
              message: _viewModel.errorMessage!,
              onRetry: _viewModel.load,
            );
          }

          final chapters = _viewModel.subject?.chapters ?? const [];

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: _viewModel.subject?.name ?? 'Môn học',
                description: '${chapters.length} chương',
                actions: [
                  FilledButton.icon(
                    onPressed: () => _createChapter(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Thêm chương'),
                  ),
                ],
              ),
              if (chapters.isEmpty)
                const EmptyView(
                  title: 'Chưa có chương',
                  description: 'Thêm chương để phân loại câu hỏi.',
                  icon: Icons.book_outlined,
                )
              else
                for (final chapter in chapters)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: AppCard(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.md,
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.book_outlined, color: colors.slate),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  chapter.name,
                                  style: Theme.of(context).textTheme.bodyLarge,
                                ),
                                Text(
                                  '${chapter.questionCount} câu hỏi',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => _editChapter(
                              context,
                              chapter.id,
                              chapter.name,
                            ),
                            icon: const Icon(Icons.edit_outlined),
                            tooltip: 'Sửa chương',
                          ),
                          IconButton(
                            onPressed: () => _deleteChapter(
                              context,
                              chapter.id,
                              chapter.name,
                            ),
                            icon: const Icon(Icons.delete_outline),
                            tooltip: 'Xoá chương',
                          ),
                        ],
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _createChapter(BuildContext context) async {
    final name = await showNameDialog(
      context,
      title: 'Thêm chương',
      label: 'Tên chương',
    );
    if (name == null) return;
    await _viewModel.createChapter(name);
  }

  Future<void> _editChapter(
    BuildContext context,
    int id,
    String currentName,
  ) async {
    final name = await showNameDialog(
      context,
      title: 'Sửa chương',
      label: 'Tên chương',
      initialValue: currentName,
    );
    if (name == null) return;
    await _viewModel.updateChapter(id, name);
  }

  Future<void> _deleteChapter(
    BuildContext context,
    int id,
    String name,
  ) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Xoá chương?',
      message:
          'Xoá chương "$name" sẽ làm các câu hỏi thuộc chương mất liên kết.',
      confirmLabel: 'Xoá',
      isDestructive: true,
    );
    if (confirmed) await _viewModel.deleteChapter(id);
  }
}
