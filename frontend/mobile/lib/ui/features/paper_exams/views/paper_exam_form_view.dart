import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/repositories/subject_repository.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../../domain/models/subject.dart';
import '../../../../domain/use_cases/paper_exam_config_validator.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/paper_exam_form_view_model.dart';

/// Form tạo đề giấy.
class PaperExamFormView extends StatefulWidget {
  const PaperExamFormView({super.key});

  @override
  State<PaperExamFormView> createState() => _PaperExamFormViewState();
}

class _PaperExamFormViewState extends State<PaperExamFormView> {
  late final PaperExamFormViewModel _viewModel;
  final _titleController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _viewModel = PaperExamFormViewModel(
      paperExamRepository: context.read<PaperExamRepository>(),
      subjectRepository: context.read<SubjectRepository>(),
      validator: context.read<PaperExamConfigValidator>(),
    );
    _viewModel.init();
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Tạo đề giấy')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải môn học…');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              const PageHeader(
                title: 'Tạo đề giấy',
                description:
                    'Nội dung đề được đóng băng tại thời điểm tạo, nên sửa câu hỏi gốc sau đó không làm đề và phiếu lệch nhau.',
              ),
              TextField(
                controller: _titleController,
                onChanged: _viewModel.setTitle,
                decoration: const InputDecoration(labelText: 'Tên đề giấy'),
              ),
              const SizedBox(height: AppSpacing.lg),
              DropdownButtonFormField<int>(
                initialValue: _viewModel.selectedSubject?.id,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Môn học'),
                items: [
                  for (final subject in _viewModel.subjects)
                    DropdownMenuItem(value: subject.id, child: Text(subject.name)),
                ],
                onChanged: (value) {
                  if (value != null) _viewModel.selectSubject(value);
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: '${_viewModel.durationMinutes}',
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Thời lượng (phút)',
                      ),
                      onChanged: (raw) {
                        final parsed = int.tryParse(raw);
                        if (parsed != null) _viewModel.setDurationMinutes(parsed);
                      },
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: TextFormField(
                      initialValue: '${_viewModel.totalQuestions}',
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Tổng số câu',
                      ),
                      onChanged: (raw) {
                        final parsed = int.tryParse(raw);
                        if (parsed != null) _viewModel.setTotalQuestions(parsed);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Cấu hình chương',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: _viewModel.selectedSubject == null
                        ? null
                        : _viewModel.addChapterConfig,
                    icon: const Icon(Icons.add),
                    label: const Text('Thêm chương'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_viewModel.selectedSubject == null)
                Text(
                  'Chọn môn học để xem danh sách chương.',
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else if (_viewModel.chapterConfigs.isEmpty)
                Text(
                  'Bấm "Thêm chương" để chọn chương và số câu cho đề.',
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else
                for (final entry in _viewModel.chapterConfigs.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _ChapterConfigRow(
                      // Key theo chapterId để dropdown đồng bộ lại khi dòng bị
                      // xoá hoặc đổi chương.
                      key: ValueKey(entry.$2.chapterId),
                      index: entry.$1,
                      config: entry.$2,
                      chapters: _viewModel.availableChapters,
                      usedChapterIds: _viewModel.usedChapterIds,
                      availableCount: _viewModel.availableCountFor(
                        entry.$2.chapterId,
                      ),
                      onSelectChapter: _viewModel.setChapterConfigChapter,
                      onAdjustCount: _viewModel.adjustChapterQuestionCount,
                      onRemove: _viewModel.removeChapterConfig,
                    ),
                  ),
              const SizedBox(height: AppSpacing.md),
              _ConfiguredTotalBanner(
                configured: _viewModel.configuredTotal,
                total: _viewModel.totalQuestions,
              ),
              if (_viewModel.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  _viewModel.errorMessage!,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: colors.pen),
                ),
              ],
              const SizedBox(height: AppSpacing.xl),
              FilledButton(
                onPressed: _viewModel.isSubmitting ? null : _handleSubmit,
                child: _viewModel.isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Tạo đề giấy'),
              ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _handleSubmit() async {
    final ok = await _viewModel.submit();
    if (!mounted) return;

    if (ok) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã tạo đề giấy.')));
      context.go('/paper-exams');
    }
  }
}

/// Một dòng cấu hình chương — chọn chương, điều chỉnh số câu, bỏ chương.
class _ChapterConfigRow extends StatelessWidget {
  const _ChapterConfigRow({
    super.key,
    required this.index,
    required this.config,
    required this.chapters,
    required this.usedChapterIds,
    required this.availableCount,
    required this.onSelectChapter,
    required this.onAdjustCount,
    required this.onRemove,
  });

  final int index;
  final PaperExamChapterConfig config;
  final List<Chapter> chapters;
  final Set<int> usedChapterIds;
  final int availableCount;
  final void Function(int index, int chapterId) onSelectChapter;
  final void Function(int index, int delta) onAdjustCount;
  final void Function(int index) onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = context.examColors;
    final overCapacity = config.questionCount > availableCount;

    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: config.chapterId,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Chương',
                    isDense: true,
                  ),
                  items: [
                    for (final chapter in chapters)
                      DropdownMenuItem(
                        value: chapter.id,
                        // Chương đã dùng ở dòng khác thì không cho chọn lại.
                        enabled:
                            chapter.id == config.chapterId ||
                            !usedChapterIds.contains(chapter.id),
                        child: Text(
                          chapter.name,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                  onChanged: (value) {
                    if (value != null) onSelectChapter(index, value);
                  },
                ),
              ),
              IconButton(
                onPressed: () => onRemove(index),
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Bỏ chương khỏi cấu hình',
                color: colors.pen,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              IconButton(
                onPressed: () => onAdjustCount(index, -1),
                icon: const Icon(Icons.remove_circle_outline),
                tooltip: 'Giảm',
              ),
              SizedBox(
                width: 40,
                child: Text(
                  '${config.questionCount}',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium,
                ),
              ),
              IconButton(
                onPressed: () => onAdjustCount(index, 1),
                icon: const Icon(Icons.add_circle_outline),
                tooltip: 'Tăng',
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Có sẵn $availableCount câu',
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ),
          if (overCapacity)
            Text(
              'Chương này chỉ có $availableCount câu.',
              style: theme.textTheme.bodySmall?.copyWith(color: colors.pen),
            ),
        ],
      ),
    );
  }
}

/// Thanh trạng thái tổng số câu đã cấu hình so với tổng số câu của đề.
class _ConfiguredTotalBanner extends StatelessWidget {
  const _ConfiguredTotalBanner({
    required this.configured,
    required this.total,
  });

  final int configured;
  final int total;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final isMatch = configured == total;
    final color = isMatch ? colors.jade : colors.pen;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.sm),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        'Tổng câu đã cấu hình: $configured / $total',
        style: Theme.of(
          context,
        ).textTheme.bodyMedium?.copyWith(color: color),
      ),
    );
  }
}
