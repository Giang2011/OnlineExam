import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:open_filex/open_filex.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../core/network_image_view.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/paper_exam_view_models.dart';

/// Chi tiết đề giấy — tải PDF, xem đáp án, danh sách kết quả quét.
class PaperExamDetailView extends StatefulWidget {
  const PaperExamDetailView({super.key, required this.paperExamId});

  final int paperExamId;

  @override
  State<PaperExamDetailView> createState() => _PaperExamDetailViewState();
}

class _PaperExamDetailViewState extends State<PaperExamDetailView> {
  late final PaperExamDetailViewModel _viewModel;
  final _studentIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _viewModel = PaperExamDetailViewModel(
      context.read<PaperExamRepository>(),
      widget.paperExamId,
    );
    _viewModel.load();
  }

  @override
  void dispose() {
    _studentIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết đề giấy')),
      body: ListenableBuilder(
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

          final paperExam = _viewModel.paperExam;
          if (paperExam == null) {
            return const EmptyView(title: 'Không tìm thấy đề giấy');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: paperExam.title,
                description: paperExam.subjectName,
              ),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        InfoChip(
                          label: '${paperExam.totalQuestions} câu',
                          icon: Icons.help_outline,
                        ),
                        InfoChip(
                          label: '${paperExam.omrQuestionsPerPage} câu/trang',
                          icon: Icons.grid_on,
                        ),
                        InfoChip(
                          label: '${paperExam.omrChoicesPerQ} lựa chọn',
                          icon: Icons.checklist,
                        ),
                        InfoChip(
                          label: '${paperExam.omrPageCount} trang',
                          icon: Icons.description_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    FilledButton.icon(
                      onPressed: () =>
                          context.go('/paper-exams/${paperExam.id}/scan'),
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Quét phiếu OMR bằng camera'),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: _viewModel.isDownloading
                          ? null
                          : () => _downloadPdf(paperExam),
                      icon: const Icon(Icons.picture_as_pdf_outlined),
                      label: _viewModel.isDownloading
                          ? const Text('Đang tải…')
                          : const Text('Tải đề giấy (PDF)'),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () => _loadAnswers(paperExam),
                      icon: const Icon(Icons.assignment_turned_in_outlined),
                      label: const Text('Xem đáp án'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Phiếu trả lời OMR',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              TextField(
                controller: _studentIdController,
                onChanged: _viewModel.setStudentId,
                decoration: const InputDecoration(
                  labelText: 'Mã sinh viên (không bắt buộc)',
                  hintText: 'VD: 2021001',
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: _viewModel.isDownloading
                    ? null
                    : () => _downloadOmrSheet(paperExam),
                icon: const Icon(Icons.download_outlined),
                label: _viewModel.isDownloading
                    ? const Text('Đang tải…')
                    : const Text('Tải phiếu OMR (PDF)'),
              ),
              if (_viewModel.answerSheet != null) ...[
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Đáp án',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                for (final question in _viewModel.answerSheet!.questions)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _AnswerCard(question: question),
                  ),
              ],
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Kết quả quét (${_viewModel.scanResults.length})',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.md),
              if (_viewModel.scanResults.isEmpty)
                const EmptyView(
                  title: 'Chưa có phiếu nào được quét',
                  icon: Icons.document_scanner_outlined,
                )
              else
                for (final scan in _viewModel.scanResults)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _ScanResultTile(scan: scan),
                  ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _downloadPdf(PaperExam paperExam) async {
    final file = await _viewModel.downloadPdf();
    if (file == null || !mounted) return;

    final result = await OpenFilex.open(file.path);
    if (result.type != ResultType.done && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã tải về ${file.path}')),
      );
    }
  }

  Future<void> _downloadOmrSheet(PaperExam paperExam) async {
    final file = await _viewModel.downloadOmrSheet();
    if (file == null || !mounted) return;

    final result = await OpenFilex.open(file.path);
    if (result.type != ResultType.done && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã tải về ${file.path}')),
      );
    }
  }

  Future<void> _loadAnswers(PaperExam paperExam) async {
    if (!paperExam.showAnswers) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đề giấy này không cho xem đáp án.')),
      );
      return;
    }
    await _viewModel.loadAnswers();
  }
}

/// Một câu hỏi kèm đáp án — hiển thị chữ cái A/B/C theo thứ tự hiển thị.
class _AnswerCard extends StatelessWidget {
  const _AnswerCard({required this.question});

  final PaperExamAnswerQuestion question;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  'Câu ${question.orderIndex}',
                  style: theme.textTheme.titleSmall,
                ),
              ),
              if (question.chapterName.isNotEmpty)
                Text(
                  question.chapterName,
                  style: theme.textTheme.labelSmall,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(question.content, style: theme.textTheme.bodyMedium),
          if (question.imageUrl != null) ...[
            const SizedBox(height: AppSpacing.sm),
            NetworkImageView(imageUrl: question.imageUrl, height: 160),
          ],
          const SizedBox(height: AppSpacing.sm),
          for (final answer in question.answers)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 24,
                    child: Text(
                      _letterFor(answer.orderIndex),
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Icon(
                    answer.isCorrect
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    size: 16,
                    color: answer.isCorrect ? colors.jade : colors.slate,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          answer.content,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: answer.isCorrect ? colors.jade : colors.ink,
                            fontWeight: answer.isCorrect
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                        if (answer.imageUrl != null)
                          NetworkImageView(
                            imageUrl: answer.imageUrl,
                            height: 90,
                          ),
                      ],
                    ),
                  ),
                  if (answer.isCorrect)
                    Text(
                      'Đúng',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colors.jade,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  /// Chuyển thứ tự hiển thị (1 = A) sang chữ cái.
  static String _letterFor(int orderIndex) {
    if (orderIndex < 1 || orderIndex > 26) return '?';
    return String.fromCharCode(64 + orderIndex);
  }
}

class _ScanResultTile extends StatelessWidget {
  const _ScanResultTile({required this.scan});

  final ScanResult scan;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    final statusColor = switch (scan.status) {
      ScanStatus.success => colors.jade,
      ScanStatus.failedToRead => colors.pen,
      ScanStatus.needsReview => colors.pen,
      ScanStatus.timeout => colors.slate,
      ScanStatus.invalidImage => colors.pen,
      ScanStatus.serviceUnavailable => colors.slate,
    };

    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      onTap: () => context.go('/paper-exams/scan-results/${scan.id}'),
      child: Row(
        children: [
          Icon(Icons.document_scanner_outlined, color: statusColor),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  scan.studentId ?? 'Phiếu #${scan.id}',
                  style: theme.textTheme.bodyLarge,
                ),
                Text(
                  '${scan.totalCorrect} đúng • ${scan.totalWrong} sai • '
                  '${scan.totalEmpty} bỏ trống'
                      '${scan.totalNeedsReview > 0 ? ' • ${scan.totalNeedsReview} cần kiểm tra' : ''}',
                  style: theme.textTheme.bodySmall,
                ),
                Text(scan.createdAt, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
          StatusBadge(label: scan.status.label, color: statusColor),
          const SizedBox(width: AppSpacing.xs),
          Icon(Icons.chevron_right, color: colors.slate),
        ],
      ),
    );
  }
}
