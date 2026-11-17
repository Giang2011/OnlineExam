import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/scan_result_detail_view_model.dart';

/// Chi tiết kết quả chấm phiếu OMR — tổng hợp điểm và kết quả từng câu.
class ScanResultDetailView extends StatefulWidget {
  const ScanResultDetailView({super.key, required this.scanResultId});

  final int scanResultId;

  @override
  State<ScanResultDetailView> createState() => _ScanResultDetailViewState();
}

class _ScanResultDetailViewState extends State<ScanResultDetailView> {
  late final ScanResultDetailViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ScanResultDetailViewModel(
      context.read<PaperExamRepository>(),
      widget.scanResultId,
    );
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Kết quả chấm phiếu')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải kết quả quét…');
          }
          if (_viewModel.errorMessage != null) {
            return ErrorView(
              message: _viewModel.errorMessage!,
              onRetry: _viewModel.load,
            );
          }

          final result = _viewModel.result;
          if (result == null) {
            return const EmptyView(title: 'Không tìm thấy kết quả quét');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: 'Kết quả chấm phiếu',
                description:
                    result.studentId ?? 'Không đọc được mã sinh viên · ${result.createdAt}',
              ),
              AppCard(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _Stat(
                            label: 'Điểm',
                            value: '${result.score}',
                            emphasis: true,
                          ),
                        ),
                        Expanded(
                          child: _Stat(
                            label: 'Đúng',
                            value: '${result.totalCorrect}',
                          ),
                        ),
                        Expanded(
                          child: _Stat(
                            label: 'Sai',
                            value: '${result.totalWrong}',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          child: _Stat(
                            label: 'Bỏ trống',
                            value: '${result.totalEmpty}',
                          ),
                        ),
                        Expanded(
                          child: _Stat(
                            label: 'Tô nhiều ô',
                            value: '${result.totalMultiMarked}',
                          ),
                        ),
                        Expanded(
                          child: _Stat(
                            label: 'Cần xem lại',
                            value: '${result.totalNeedsReview}',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (result.errors.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.lg),
                AppCard(
                  borderColor: context.examColors.pen.withValues(alpha: 0.4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lỗi trong quá trình chấm',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: context.examColors.pen,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      for (final error in result.errors)
                        Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                          child: Text(
                            '• $error',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: context.examColors.pen,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Kết quả từng câu',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.md),
              if (result.questionResults.isEmpty)
                const EmptyView(
                  title: 'Không có kết quả chi tiết từng câu',
                  icon: Icons.checklist_outlined,
                )
              else
                for (final question in result.questionResults)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _QuestionResultCard(question: question),
                  ),
              const SizedBox(height: AppSpacing.xl),
              FilledButton(
                onPressed: () => context.go('/paper-exams/${result.paperExamId}'),
                child: const Text('Về đề giấy'),
              ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }
}

/// Kết quả chấm của một câu — đáp án tô, đáp án đúng, trạng thái, độ tin cậy.
class _QuestionResultCard extends StatelessWidget {
  const _QuestionResultCard({required this.question});

  final QuestionScanResult question;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    final statusColor = switch (question.status) {
      QuestionScanStatus.correct => colors.jade,
      QuestionScanStatus.wrong => colors.pen,
      QuestionScanStatus.empty => colors.slate,
      QuestionScanStatus.multiMarked => colors.pen,
      QuestionScanStatus.needsReview => colors.chalk,
      QuestionScanStatus.ignored => colors.slate,
    };

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 52,
                child: Text(
                  'Câu ${question.questionIndex}',
                  style: theme.textTheme.labelMedium,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      question.selectedOptions.isEmpty
                          ? 'Không tô ô nào'
                          : 'Đáp án tô: ${question.selectedOptions.join(', ')}',
                      style: theme.textTheme.bodyMedium,
                    ),
                    Text(
                      question.correctOptions.isEmpty
                          ? 'Đáp án đúng: —'
                          : 'Đáp án đúng: ${question.correctOptions.join(', ')}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusBadge(
                label: question.status.label,
                color: statusColor,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Độ tin cậy: ${(question.confidence * 100).round()}%',
            style: theme.textTheme.labelSmall,
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.label,
    required this.value,
    this.emphasis = false,
  });

  final String label;
  final String value;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: AppTypography.numeric(
            emphasis ? 22 : 18,
            context.examColors.ink,
            weight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
