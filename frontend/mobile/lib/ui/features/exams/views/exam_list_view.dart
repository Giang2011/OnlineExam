import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/exam_repository.dart';
import '../../../../domain/models/exam.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/exam_list_view_model.dart';

/// Danh sách kỳ thi — giáo viên và quản trị viên.
class ExamListView extends StatefulWidget {
  const ExamListView({super.key});

  @override
  State<ExamListView> createState() => _ExamListViewState();
}

class _ExamListViewState extends State<ExamListView> {
  late final ExamListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ExamListViewModel(context.read<ExamRepository>());
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
              return const LoadingView(message: 'Đang tải danh sách kỳ thi…');
            }
            if (_viewModel.errorMessage != null) {
              return ErrorView(
                message: _viewModel.errorMessage!,
                onRetry: _viewModel.load,
              );
            }

            final exams = _viewModel.filteredExams;

            return RefreshIndicator(
              onRefresh: _viewModel.load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  PageHeader(
                    title: 'Kỳ thi',
                    description: 'Tạo kỳ thi, gán thí sinh và theo dõi tiến độ.',
                    actions: [
                      FilledButton.icon(
                        onPressed: () => context.go('/exams/new'),
                        icon: const Icon(Icons.add),
                        label: const Text('Tạo kỳ thi'),
                      ),
                    ],
                  ),
                  _StatusFilterBar(
                    selected: _viewModel.statusFilter,
                    onSelected: _viewModel.setStatusFilter,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  if (exams.isEmpty)
                    const EmptyView(
                      title: 'Chưa có kỳ thi',
                      description: 'Bấm "Tạo kỳ thi" để bắt đầu.',
                      icon: Icons.assignment_outlined,
                    )
                  else
                    for (final exam in exams)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: _ExamListCard(exam: exam),
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
}

class _StatusFilterBar extends StatelessWidget {
  const _StatusFilterBar({required this.selected, required this.onSelected});

  final ExamStatus? selected;
  final ValueChanged<ExamStatus?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChip(
            label: 'Tất cả',
            isSelected: selected == null,
            onTap: () => onSelected(null),
          ),
          for (final status in ExamStatus.values)
            _FilterChip(
              label: status.label,
              isSelected: selected == status,
              onTap: () => onSelected(status),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: colors.chalk.withValues(alpha: 0.14),
        labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: isSelected ? colors.chalk : colors.slate,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
    );
  }
}

class _ExamListCard extends StatelessWidget {
  const _ExamListCard({required this.exam});

  final Exam exam;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    final statusColor = switch (exam.status) {
      ExamStatus.upcoming => colors.slate,
      ExamStatus.ongoing => colors.jade,
      ExamStatus.completed => colors.pen,
    };

    return AppCard(
      onTap: () => context.go('/exams/${exam.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(exam.title, style: theme.textTheme.titleMedium),
              ),
              const SizedBox(width: AppSpacing.sm),
              StatusBadge(label: exam.status.label, color: statusColor),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              InfoChip(label: exam.subjectName, icon: Icons.folder_outlined),
              InfoChip(label: '${exam.totalQuestions} câu', icon: Icons.help_outline),
              InfoChip(label: '${exam.duration} phút', icon: Icons.schedule),
              InfoChip(
                label: '${exam.participantCount} thí sinh',
                icon: Icons.group_outlined,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
