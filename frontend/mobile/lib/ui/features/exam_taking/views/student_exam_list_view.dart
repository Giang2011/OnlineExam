import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/session_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/exam.dart';
import '../../../../domain/models/exam_session.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/student_exam_list_view_model.dart';

/// Danh sách kỳ thi được phân công cho học sinh.
class StudentExamListView extends StatefulWidget {
  const StudentExamListView({super.key});

  @override
  State<StudentExamListView> createState() => _StudentExamListViewState();
}

class _StudentExamListViewState extends State<StudentExamListView> {
  late final StudentExamListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = StudentExamListViewModel(
      context.read<ExamRepository>(),
      context.read<SessionRepository>(),
    );
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
            if (_viewModel.exams.isEmpty) {
              return const EmptyView(
                title: 'Chưa có kỳ thi nào',
                description: 'Bạn sẽ thấy các kỳ thi được phân công tại đây.',
                icon: Icons.assignment_outlined,
              );
            }

            return RefreshIndicator(
              onRefresh: _viewModel.load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  const PageHeader(
                    title: 'Kỳ thi của tôi',
                    description: 'Chọn kỳ thi để bắt đầu làm bài.',
                  ),
                  if (_viewModel.activeSession != null) ...[
                    _ActiveSessionBanner(
                      session: _viewModel.activeSession!,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                  ],
                  for (final exam in _viewModel.exams)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: _ExamCard(exam: exam),
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

class _ActiveSessionBanner extends StatelessWidget {
  const _ActiveSessionBanner({required this.session});

  final ActiveSession session;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.chalk.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: colors.chalk.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.play_circle_outline, color: colors.chalk),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bạn đang thi ${session.examTitle}',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Chọn "Tiếp tục" để vào lại bài thi.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed: () =>
                context.go('/exam-taking/${session.sessionId}'),
            child: const Text('Tiếp tục'),
          ),
        ],
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  const _ExamCard({required this.exam});

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
      onTap: exam.status == ExamStatus.completed
          ? null
          : () => _handleStart(context),
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
              StatusBadge(
                label: exam.status.label,
                color: statusColor,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              InfoChip(label: exam.subjectName, icon: Icons.folder_outlined),
              InfoChip(
                label: '${exam.totalQuestions} câu',
                icon: Icons.help_outline,
              ),
              InfoChip(
                label: '${exam.duration} phút',
                icon: Icons.schedule,
              ),
              InfoChip(
                label: 'Tối đa ${exam.maxAttempts} lượt',
                icon: Icons.replay,
              ),
            ],
          ),
          if (exam.status != ExamStatus.completed) ...[
            const SizedBox(height: AppSpacing.md),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: () => _handleStart(context),
                child: const Text('Bắt đầu thi'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _handleStart(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final session = await context.read<SessionRepository>().start(exam.id);
      if (!context.mounted) return;
      context.go('/exam-taking/${session.id}');
    } catch (e) {
      final message = e is ApiError
          ? e.message
          : 'Không thể bắt đầu kỳ thi.';
      messenger.showSnackBar(SnackBar(content: Text(message)));
    }
  }
}
