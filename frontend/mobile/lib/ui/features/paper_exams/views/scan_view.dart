import 'dart:io';

import 'package:camera/camera.dart';
import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../core/dialogs.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/scan_view_model.dart';

/// Quét phiếu trả lời OMR bằng camera.
class ScanView extends StatefulWidget {
  const ScanView({super.key, required this.paperExamId});

  final int paperExamId;

  @override
  State<ScanView> createState() => _ScanViewState();
}

class _ScanViewState extends State<ScanView> {
  late final ScanViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ScanViewModel(
      repository: context.read<PaperExamRepository>(),
      paperExamId: widget.paperExamId,
    );
    _viewModel.init();
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Quét phiếu OMR')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.status == ScanViewStatus.done &&
              _viewModel.result != null) {
            return _ScanResultView(result: _viewModel.result!);
          }

          return Column(
            children: [
              Expanded(child: _buildCameraPreview(colors)),
              _buildBottomPanel(colors),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Widget _buildCameraPreview(ExamColors colors) {
    if (_viewModel.errorMessage != null &&
        !_viewModel.isCameraReady) {
      return ErrorView(
        message: _viewModel.errorMessage!,
        onRetry: _viewModel.init,
      );
    }

    final controller = _viewModel.cameraController;
    if (controller == null || !controller.value.isInitialized) {
      return const LoadingView(message: 'Đang khởi động camera…');
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final previewSize = controller.value.previewSize;
        // Camera trả kích thước theo cảm biến (xoay) — cần đảo chiều để khớp.
        if (previewSize == null) return const SizedBox.shrink();

        return Center(
          child: ClipRect(
            child: OverflowBox(
              alignment: Alignment.center,
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: previewSize.height,
                  height: previewSize.width,
                  child: CameraPreview(controller),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBottomPanel(ExamColors colors) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: colors.paperElevated,
        border: Border(top: BorderSide(color: colors.hairline)),
      ),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Đã chụp ${_viewModel.pageCount} trang',
                    style: theme.textTheme.titleSmall,
                  ),
                ),
                if (_viewModel.pageCount > 0)
                  TextButton(
                    onPressed: _viewModel.removeLastImage,
                    child: const Text('Xoá trang cuối'),
                  ),
              ],
            ),
            if (_viewModel.capturedImages.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                height: 64,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _viewModel.capturedImages.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final file = File(_viewModel.capturedImages[index].path);
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      child: Image.file(
                        file,
                        width: 52,
                        height: 64,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const SizedBox(
                          width: 52,
                          height: 64,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
            if (_viewModel.errorMessage != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                _viewModel.errorMessage!,
                style: theme.textTheme.bodySmall?.copyWith(color: colors.pen),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _viewModel.status == ScanViewStatus.uploading
                        ? null
                        : _viewModel.capture,
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('Chụp trang'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _viewModel.pageCount == 0 ||
                            _viewModel.status == ScanViewStatus.uploading
                        ? null
                        : _handleSubmit,
                    icon: _viewModel.status == ScanViewStatus.uploading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.cloud_upload_outlined),
                    label: const Text('Gửi chấm'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Gửi phiếu chấm?',
      message:
          'Đã chụp ${_viewModel.pageCount} trang. Hệ thống sẽ chấm và trả về kết quả từng câu.',
      confirmLabel: 'Gửi',
    );
    if (!confirmed) return;

    await _viewModel.submit();
  }
}

class _ScanResultView extends StatelessWidget {
  const _ScanResultView({required this.result});

  final ScanResult result;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    final statusColor = result.status == ScanStatus.success
        ? colors.jade
        : colors.pen;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        PageHeader(
          title: 'Kết quả quét',
          description: result.studentId ?? 'Phiếu #${result.id}',
        ),
        AppCard(
          child: Column(
            children: [
              StatusBadge(label: result.status.label, color: statusColor),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: _Stat(label: 'Đúng', value: '${result.totalCorrect}'),
                  ),
                  Expanded(
                    child: _Stat(label: 'Sai', value: '${result.totalWrong}'),
                  ),
                  Expanded(
                    child: _Stat(label: 'Bỏ trống', value: '${result.totalEmpty}'),
                  ),
                  Expanded(
                    child: _Stat(
                      label: 'Cần kiểm tra',
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Lỗi', style: theme.textTheme.titleSmall),
                const SizedBox(height: AppSpacing.sm),
                for (final error in result.errors)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Text(
                      '• $error',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.pen,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        Text(
          'Chi tiết từng câu',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: AppSpacing.md),
        for (final question in result.questionResults)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  SizedBox(
                    width: 44,
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
                              : 'Đã tô: ${question.selectedOptions.join(', ')}',
                          style: theme.textTheme.bodyMedium,
                        ),
                        Text(
                          'Đáp án: ${question.correctOptions.join(', ')}',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(
                    label: question.status.label,
                    color: switch (question.status) {
                      QuestionScanStatus.correct => colors.jade,
                      QuestionScanStatus.wrong => colors.pen,
                      QuestionScanStatus.empty => colors.slate,
                      _ => colors.pen,
                    },
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: AppSpacing.xl),
        FilledButton(
          onPressed: () => context.go('/paper-exams'),
          child: const Text('Về danh sách đề giấy'),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: AppTypography.numeric(
            20,
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
