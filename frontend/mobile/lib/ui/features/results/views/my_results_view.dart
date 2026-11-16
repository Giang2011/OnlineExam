import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/repositories/session_repository.dart';
import '../../../../domain/models/exam_result.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/results_view_models.dart';

/// Lịch sử điểm của học sinh.
class MyResultsView extends StatefulWidget {
  const MyResultsView({super.key});

  @override
  State<MyResultsView> createState() => _MyResultsViewState();
}

class _MyResultsViewState extends State<MyResultsView> {
  late final MyResultsViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = MyResultsViewModel(context.read<ResultRepository>());
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
              return const LoadingView(message: 'Đang tải lịch sử điểm…');
            }
            if (_viewModel.errorMessage != null) {
              return ErrorView(
                message: _viewModel.errorMessage!,
                onRetry: _viewModel.load,
              );
            }
            if (_viewModel.results.isEmpty) {
              return const EmptyView(
                title: 'Chưa có kết quả',
                description: 'Làm bài kỳ thi để xem điểm của bạn ở đây.',
                icon: Icons.leaderboard_outlined,
              );
            }

            return RefreshIndicator(
              onRefresh: _viewModel.load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  const PageHeader(
                    title: 'Lịch sử điểm',
                    description: 'Kết quả các lượt thi của bạn.',
                  ),
                  _SummaryRow(
                    average: _viewModel.averageScore,
                    best: _viewModel.bestScore,
                    count: _viewModel.results.length,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  for (final result in _viewModel.results)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: _ResultCard(result: result),
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.average,
    required this.best,
    required this.count,
  });

  final double average;
  final double best;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SummaryTile(
            label: 'Trung bình',
            value: average.toStringAsFixed(1),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _SummaryTile(label: 'Cao nhất', value: best.toStringAsFixed(1)),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(child: _SummaryTile(label: 'Số lượt', value: '$count')),
      ],
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.paperElevated,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: colors.hairline),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTypography.numeric(22, colors.ink, weight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});

  final ExamResult result;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);
    final isGood = result.score >= 5;

    return AppCard(
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: (isGood ? colors.jade : colors.pen).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Text(
              result.score.toStringAsFixed(1),
              style: AppTypography.numeric(
                18,
                isGood ? colors.jade : colors.pen,
                weight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(result.examTitle, style: theme.textTheme.titleSmall),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Đúng ${result.totalCorrect}/${result.totalQuestions} câu',
                  style: theme.textTheme.bodySmall,
                ),
                Text(
                  result.submittedAt,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
