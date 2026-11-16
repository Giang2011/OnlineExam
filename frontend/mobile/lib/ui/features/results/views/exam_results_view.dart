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

/// Bảng điểm một kỳ thi — giáo viên / quản trị viên.
class ExamResultsView extends StatefulWidget {
  const ExamResultsView({super.key, required this.examId});

  final int examId;

  @override
  State<ExamResultsView> createState() => _ExamResultsViewState();
}

class _ExamResultsViewState extends State<ExamResultsView> {
  late final ExamResultsViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ExamResultsViewModel(
      context.read<ResultRepository>(),
      widget.examId,
    );
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Bảng điểm')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải bảng điểm…');
          }
          if (_viewModel.errorMessage != null) {
            return ErrorView(
              message: _viewModel.errorMessage!,
              onRetry: _viewModel.load,
            );
          }

          final report = _viewModel.report;
          if (report == null) {
            return const EmptyView(title: 'Không có kết quả');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: report.examTitle,
                description: '${report.statistics.totalSubmitted} lượt thi',
              ),
              _StatisticsCard(statistics: report.statistics),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Kết quả chi tiết',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.md),
              if (report.results.isEmpty)
                const EmptyView(
                  title: 'Chưa có lượt thi nào',
                  icon: Icons.leaderboard_outlined,
                )
              else
                for (final result in report.results)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _ResultRow(result: result),
                  ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }
}

class _StatisticsCard extends StatelessWidget {
  const _StatisticsCard({required this.statistics});

  final ExamStatistics statistics;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    final maxCount = statistics.distribution.fold<int>(
      0,
      (acc, v) => v > acc ? v : acc,
    );

    const labels = ['0–2', '2–4', '4–6', '6–8', '8–10'];

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Thống kê', style: theme.textTheme.titleSmall),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _StatTile(
                  label: 'Trung bình',
                  value: statistics.average.toStringAsFixed(1),
                  color: colors.chalk,
                ),
              ),
              Expanded(
                child: _StatTile(
                  label: 'Cao nhất',
                  value: statistics.highest.toStringAsFixed(1),
                  color: colors.jade,
                ),
              ),
              Expanded(
                child: _StatTile(
                  label: 'Thấp nhất',
                  value: statistics.lowest.toStringAsFixed(1),
                  color: colors.pen,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Phân bố điểm', style: theme.textTheme.labelMedium),
          const SizedBox(height: AppSpacing.sm),
          for (var i = 0; i < statistics.distribution.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                children: [
                  SizedBox(
                    width: 44,
                    child: Text(
                      labels[i],
                      style: AppTypography.numeric(12, colors.slate),
                    ),
                  ),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: LinearProgressIndicator(
                        value: maxCount == 0
                            ? 0
                            : statistics.distribution[i] / maxCount,
                        minHeight: 18,
                        backgroundColor: colors.hairline,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  SizedBox(
                    width: 32,
                    child: Text(
                      '${statistics.distribution[i]}',
                      textAlign: TextAlign.right,
                      style: AppTypography.numeric(12, colors.ink),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: AppTypography.numeric(22, color, weight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _ResultRow extends StatelessWidget {
  const _ResultRow({required this.result});

  final ExamResult result;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);
    final isGood = result.score >= 5;

    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: Text(
              '${result.rank ?? '-'}',
              style: AppTypography.numeric(14, colors.slate),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(result.studentName, style: theme.textTheme.bodyLarge),
                Text(
                  'Đúng ${result.totalCorrect}/${result.totalQuestions}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: (isGood ? colors.jade : colors.pen).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Text(
              result.score.toStringAsFixed(1),
              style: AppTypography.numeric(
                15,
                isGood ? colors.jade : colors.pen,
                weight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
