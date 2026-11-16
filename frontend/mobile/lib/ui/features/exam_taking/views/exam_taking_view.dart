import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/repositories/session_repository.dart';
import '../../../../data/services/connectivity_service.dart';
import '../../../../domain/models/exam_session.dart';
import '../../../../domain/use_cases/sync_answers_use_case.dart';
import '../../../core/omr_grid.dart';
import '../../../core/network_image_view.dart';
import '../../../core/state_views.dart';
import '../view_models/exam_taking_view_model.dart';

/// Màn làm bài.
class ExamTakingView extends StatefulWidget {
  const ExamTakingView({super.key, required this.sessionId});

  final int sessionId;

  @override
  State<ExamTakingView> createState() => _ExamTakingViewState();
}

class _ExamTakingViewState extends State<ExamTakingView> {
  late final ExamTakingViewModel _viewModel;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _viewModel = ExamTakingViewModel(
      sessionRepository: context.read<SessionRepository>(),
      syncAnswers: context.read<SyncAnswersUseCase>(),
      connectivity: context.read<ConnectivityService>(),
      sessionId: widget.sessionId,
    );
    _viewModel.init();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _viewModel.dispose();
    super.dispose();
  }

  Future<bool> _handleBack() async {
    // Android 14+ predictive back — cần hỏi xác nhận vì đáp án đã autosave
    // nhưng việc thoát vẫn dễ gây nhầm lẫn.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thoát khỏi bài thi?'),
        content: const Text(
          'Đáp án của bạn đã được lưu. Bạn có thể quay lại và tiếp tục trong kỳ thi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Ở lại'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Thoát'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      context.go('/my-exams');
    }
    return confirmed == true;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            _viewModel.session?.examTitle ?? 'Làm bài',
          ),
          leading: IconButton(
            onPressed: _handleBack,
            icon: const Icon(Icons.close),
            tooltip: 'Thoát',
          ),
          actions: [
            ListenableBuilder(
              listenable: _viewModel,
              builder: (context, _) {
                final countdown = _viewModel.countdown;
                final isWarning = countdown.isWarning;
                final isExpired = countdown.isExpired;

                return Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.lg),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: (isExpired || isWarning
                                ? colors.pen
                                : colors.chalk)
                            .withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        border: Border.all(
                          color: (isExpired || isWarning
                                  ? colors.pen
                                  : colors.chalk)
                              .withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 16,
                            color: isExpired || isWarning
                                ? colors.pen
                                : colors.chalk,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            countdown.formatted,
                            style: AppTypography.numeric(
                              15,
                              isExpired || isWarning ? colors.pen : colors.ink,
                              weight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
        body: ListenableBuilder(
          listenable: _viewModel,
          builder: (context, _) {
            switch (_viewModel.status) {
              case ExamTakingStatus.loading:
                return const LoadingView(message: 'Đang tải đề thi…');
              case ExamTakingStatus.failed:
                return ErrorView(
                  message: _viewModel.errorMessage ?? 'Không tải được đề thi.',
                  onRetry: _viewModel.init,
                );
              case ExamTakingStatus.submitted:
                return _SubmittedView(viewModel: _viewModel);
              case ExamTakingStatus.submitting:
              case ExamTakingStatus.ready:
                return _ExamBody(
                  viewModel: _viewModel,
                  scrollController: _scrollController,
                );
            }
          },
        ),
        bottomNavigationBar: ListenableBuilder(
          listenable: _viewModel,
          builder: (context, _) {
            if (_viewModel.status != ExamTakingStatus.ready) {
              return const SizedBox.shrink();
            }
            return _ExamFooter(viewModel: _viewModel);
          },
        ),
        backgroundColor: colors.paper,
      ),
    );
  }
}

class _ExamBody extends StatelessWidget {
  const _ExamBody({required this.viewModel, required this.scrollController});

  final ExamTakingViewModel viewModel;
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    final question = viewModel.currentQuestion;

    if (question == null) {
      return const EmptyView(title: 'Đề thi không có câu hỏi');
    }

    return Column(
      children: [
        if (!viewModel.isOnline || viewModel.hasPendingSync)
          _SyncBanner(
            isOnline: viewModel.isOnline,
            hasPending: viewModel.hasPendingSync,
          ),
        Expanded(
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              _QuestionCard(
                question: question,
                index: viewModel.currentIndex,
                total: viewModel.questions.length,
                selectedAnswerIds: viewModel.currentSelectedAnswerIds,
                onToggle: viewModel.toggleAnswer,
              ),
              const SizedBox(height: AppSpacing.lg),
              const Divider(),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Câu ${viewModel.currentIndex + 1}/${viewModel.questions.length}',
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              OmrGrid(
                totalQuestions: viewModel.questions.length,
                answeredIndexes: viewModel.answeredIndexes,
                currentIndex: viewModel.currentIndex,
                onTap: viewModel.goToQuestion,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.question,
    required this.index,
    required this.total,
    required this.selectedAnswerIds,
    required this.onToggle,
  });

  final SessionQuestion question;
  final int index;
  final int total;
  final List<int> selectedAnswerIds;
  final ValueChanged<int> onToggle;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Câu ${index + 1}',
          style: theme.textTheme.labelMedium?.copyWith(color: colors.slate),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          question.content,
          style: AppTypography.question(17, colors.ink),
        ),
        if (question.imageUrl != null) ...[
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: NetworkImageView(imageUrl: question.imageUrl),
          ),
        ],
        if (question.isMultipleChoice) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Có thể chọn nhiều đáp án',
            style: theme.textTheme.bodySmall?.copyWith(color: colors.slate),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        for (final answer in question.answers)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: _AnswerOption(
              answer: answer,
              isSelected: selectedAnswerIds.contains(answer.answerId),
              isMultiple: question.isMultipleChoice,
              onTap: () => onToggle(answer.answerId),
            ),
          ),
      ],
    );
  }
}

class _AnswerOption extends StatelessWidget {
  const _AnswerOption({
    required this.answer,
    required this.isSelected,
    required this.isMultiple,
    required this.onTap,
  });

  final SessionAnswer answer;
  final bool isSelected;
  final bool isMultiple;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? colors.chalk.withValues(alpha: 0.08)
                : colors.paperElevated,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(
              color: isSelected ? colors.chalk : colors.hairline,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isMultiple
                    ? (isSelected
                          ? Icons.check_box
                          : Icons.check_box_outline_blank)
                    : (isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked),
                size: 22,
                color: isSelected ? colors.chalk : colors.slate,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(answer.content, style: theme.textTheme.bodyLarge),
                    if (answer.imageUrl != null) ...[
                      const SizedBox(height: AppSpacing.sm),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                        child: NetworkImageView(imageUrl: answer.imageUrl),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SyncBanner extends StatelessWidget {
  const _SyncBanner({required this.isOnline, required this.hasPending});

  final bool isOnline;
  final bool hasPending;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    final message = !isOnline
        ? 'Mất mạng — đáp án đang lưu cục bộ và sẽ đồng bộ khi có mạng.'
        : 'Đang đồng bộ đáp án lên máy chủ…';

    return Container(
      width: double.infinity,
      color: colors.pen.withValues(alpha: 0.08),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          Icon(
            isOnline ? Icons.sync : Icons.cloud_off,
            size: 16,
            color: colors.pen,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.pen),
            ),
          ),
        ],
      ),
    );
  }
}

class _ExamFooter extends StatelessWidget {
  const _ExamFooter({required this.viewModel});

  final ExamTakingViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Container(
      decoration: BoxDecoration(
        color: colors.paperElevated,
        border: Border(top: BorderSide(color: colors.hairline)),
      ),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        AppSpacing.sm,
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            IconButton(
              onPressed: viewModel.currentIndex > 0
                  ? viewModel.previousQuestion
                  : null,
              icon: const Icon(Icons.chevron_left),
              tooltip: 'Câu trước',
              constraints: const BoxConstraints(
                minWidth: AppSpacing.minTouchTarget,
                minHeight: AppSpacing.minTouchTarget,
              ),
            ),
            Expanded(
              child: FilledButton(
                onPressed: () => _confirmSubmit(context),
                child: const Text('Nộp bài'),
              ),
            ),
            IconButton(
              onPressed: viewModel.currentIndex < viewModel.questions.length - 1
                  ? viewModel.nextQuestion
                  : null,
              icon: const Icon(Icons.chevron_right),
              tooltip: 'Câu sau',
              constraints: const BoxConstraints(
                minWidth: AppSpacing.minTouchTarget,
                minHeight: AppSpacing.minTouchTarget,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmSubmit(BuildContext context) async {
    final unanswered = viewModel.questions.length - viewModel.answeredIndexes.length;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nộp bài?'),
        content: Text(
          unanswered > 0
              ? 'Bạn còn $unanswered câu chưa trả lời. Hệ thống sẽ chấm điểm và không thể sửa bài sau khi nộp.'
              : 'Bạn đã trả lời đủ ${viewModel.questions.length} câu. Sau khi nộp sẽ không thể sửa bài.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Kiểm tra lại'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Nộp bài'),
          ),
        ],
      ),
    );

    if (confirmed == true) await viewModel.submit();
  }
}

class _SubmittedView extends StatelessWidget {
  const _SubmittedView({required this.viewModel});

  final ExamTakingViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);
    final session = viewModel.session;

    final score = session?.score;
    final correct = session?.totalCorrect;
    final total = session?.totalQuestions;

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle_outline, size: 56, color: colors.jade),
              const SizedBox(height: AppSpacing.lg),
              Text('Đã nộp bài', style: theme.textTheme.headlineSmall),
              const SizedBox(height: AppSpacing.sm),
              if (session?.submitSource != null)
                Text(
                  session!.submitSource!.label,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium,
                ),
              const SizedBox(height: AppSpacing.xxl),
              if (score != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    color: colors.paperElevated,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    border: Border.all(color: colors.hairline),
                  ),
                  child: Column(
                    children: [
                      Text('Điểm', style: theme.textTheme.bodySmall),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        score.toStringAsFixed(1),
                        style: AppTypography.numeric(
                          48,
                          colors.chalk,
                          weight: FontWeight.w700,
                        ),
                      ),
                      if (correct != null && total != null) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Đúng $correct/$total câu',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.xl),
              FilledButton(
                onPressed: () => context.go('/my-results'),
                child: const Text('Xem lịch sử điểm'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
