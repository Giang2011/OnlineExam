import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/paper_exam_view_models.dart';

/// Danh sách đề giấy.
class PaperExamListView extends StatefulWidget {
  const PaperExamListView({super.key});

  @override
  State<PaperExamListView> createState() => _PaperExamListViewState();
}

class _PaperExamListViewState extends State<PaperExamListView> {
  late final PaperExamListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = PaperExamListViewModel(context.read<PaperExamRepository>());
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
              return const LoadingView(message: 'Đang tải đề giấy…');
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
                    title: 'Đề giấy & OMR',
                    description:
                        'Sinh đề giấy in kèm phiếu trả lời OMR, quét bằng camera.',
                    actions: [
                      FilledButton.icon(
                        onPressed: () => context.go('/paper-exams/new'),
                        icon: const Icon(Icons.add),
                        label: const Text('Tạo đề giấy'),
                      ),
                    ],
                  ),
                  if (_viewModel.paperExams.isEmpty)
                    const EmptyView(
                      title: 'Chưa có đề giấy',
                      description: 'Tạo đề giấy để sinh phiếu trả lời OMR.',
                      icon: Icons.description_outlined,
                    )
                  else
                    for (final paperExam in _viewModel.paperExams)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: _PaperExamCard(
                          paperExam: paperExam,
                          onDelete: () => _confirmDelete(paperExam),
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

  Future<void> _confirmDelete(PaperExam paperExam) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Xoá đề giấy?',
      message: 'Xoá "${paperExam.title}"? Thao tác này không thể hoàn tác.',
      confirmLabel: 'Xoá',
      isDestructive: true,
    );
    if (confirmed) await _viewModel.delete(paperExam.id);
  }
}

class _PaperExamCard extends StatelessWidget {
  const _PaperExamCard({required this.paperExam, required this.onDelete});

  final PaperExam paperExam;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return AppCard(
      onTap: () => context.go('/paper-exams/${paperExam.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(paperExam.title, style: theme.textTheme.titleMedium),
              ),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Xoá đề giấy',
                color: colors.slate,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              InfoChip(label: paperExam.subjectName, icon: Icons.folder_outlined),
              InfoChip(
                label: '${paperExam.totalQuestions} câu',
                icon: Icons.help_outline,
              ),
              InfoChip(
                label: '${paperExam.omrPageCount} trang OMR',
                icon: Icons.grid_on,
              ),
              InfoChip(
                label: '${paperExam.durationMinutes} phút',
                icon: Icons.schedule,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
