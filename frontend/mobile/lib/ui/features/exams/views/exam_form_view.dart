import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../../domain/use_cases/chapter_config_validator.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/exam_form_view_model.dart';

/// Form tạo / sửa kỳ thi.
class ExamFormView extends StatefulWidget {
  const ExamFormView({super.key, this.examId});

  final int? examId;

  @override
  State<ExamFormView> createState() => _ExamFormViewState();
}

class _ExamFormViewState extends State<ExamFormView> {
  late final ExamFormViewModel _viewModel;
  late final TextEditingController _titleController;

  @override
  void initState() {
    super.initState();
    _viewModel = ExamFormViewModel(
      examRepository: context.read<ExamRepository>(),
      subjectRepository: context.read<SubjectRepository>(),
      validator: context.read<ChapterConfigValidator>(),
      examId: widget.examId,
    );
    _titleController = TextEditingController();
    _viewModel.init().then((_) {
      if (mounted) _titleController.text = _viewModel.title;
    });
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
      appBar: AppBar(
        title: Text(widget.examId == null ? 'Tạo kỳ thi' : 'Sửa kỳ thi'),
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải dữ liệu…');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: widget.examId == null ? 'Tạo kỳ thi' : 'Sửa kỳ thi',
                description:
                    'Tổng số câu phải khớp với tổng số câu cấu hình cho các chương.',
              ),
              TextField(
                controller: _titleController,
                onChanged: _viewModel.setTitle,
                decoration: const InputDecoration(
                  labelText: 'Tên kỳ thi',
                  hintText: 'Ví dụ: Kiểm tra giữa kỳ - Toán',
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              DropdownButtonFormField<int>(
                initialValue: _viewModel.selectedSubject?.id,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Môn học'),
                items: [
                  for (final subject in _viewModel.subjects)
                    DropdownMenuItem(
                      value: subject.id,
                      child: Text(subject.name),
                    ),
                ],
                onChanged: (value) {
                  if (value != null) _viewModel.selectSubject(value);
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: _NumberField(
                      label: 'Thời lượng (phút)',
                      value: _viewModel.duration,
                      min: 1,
                      onChanged: _viewModel.setDuration,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _NumberField(
                      label: 'Tổng số câu',
                      value: _viewModel.totalQuestions,
                      min: 1,
                      onChanged: _viewModel.setTotalQuestions,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: _NumberField(
                      label: 'Số đề (biến thể)',
                      value: _viewModel.totalVariants,
                      min: 1,
                      onChanged: _viewModel.setTotalVariants,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _NumberField(
                      label: 'Số lượt thi tối đa',
                      value: _viewModel.maxAttempts,
                      min: 1,
                      onChanged: _viewModel.setMaxAttempts,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Cấu hình chương',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_viewModel.selectedSubject == null)
                Text(
                  'Chọn môn học để xem danh sách chương.',
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else
                for (final chapter in _viewModel.selectedSubject!.chapters)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _ChapterConfigRow(
                      name: chapter.name,
                      available: chapter.questionCount,
                      count: _viewModel.getChapterQuestionCount(chapter.id),
                      onChanged: (value) =>
                          _viewModel.setChapterQuestionCount(chapter.id, value),
                    ),
                  ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Thời gian',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              _DateTimeField(
                label: 'Bắt đầu',
                value: _viewModel.startTime,
                onChanged: _viewModel.setStartTime,
              ),
              const SizedBox(height: AppSpacing.sm),
              _DateTimeField(
                label: 'Kết thúc',
                value: _viewModel.endTime,
                onChanged: _viewModel.setEndTime,
              ),
              if (_viewModel.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.lg),
                _ErrorBanner(message: _viewModel.errorMessage!),
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
                    : Text(widget.examId == null ? 'Tạo kỳ thi' : 'Lưu thay đổi'),
              ),
              if (widget.examId != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Đổi cấu hình chương sẽ sinh lại đề thi — thí sinh sẽ thi đề mới.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
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
      ).showSnackBar(const SnackBar(content: Text('Đã lưu kỳ thi.')));
      context.go('/exams');
    }
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.label,
    required this.value,
    required this.min,
    required this.onChanged,
  });

  final String label;
  final int value;
  final int min;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: '$value',
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label),
      onChanged: (raw) {
        final parsed = int.tryParse(raw);
        if (parsed != null) onChanged(parsed < min ? min : parsed);
      },
    );
  }
}

class _ChapterConfigRow extends StatelessWidget {
  const _ChapterConfigRow({
    required this.name,
    required this.available,
    required this.count,
    required this.onChanged,
  });

  final String name;
  final int available;
  final int count;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final isOver = count > available;

    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: Theme.of(context).textTheme.bodyLarge),
                Text(
                  'Có sẵn $available câu',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.slate),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: count > 0 ? () => onChanged(count - 1) : null,
            icon: const Icon(Icons.remove_circle_outline),
            tooltip: 'Giảm',
          ),
              SizedBox(
                width: 40,
            child: Text(
              '$count',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          IconButton(
            onPressed: () => onChanged(count + 1),
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Tăng',
          ),
        ],
      ),
    ).withBorder(isOver ? colors.pen : null);
  }
}

extension on Widget {
  Widget withBorder(Color? color) {
    if (color == null) return this;
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: this,
    );
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () => _pick(context),
      icon: const Icon(Icons.event_outlined),
      label: Text(
        value == null
            ? '$label — chưa chọn'
            : '$label: ${_format(value!)}',
        style: Theme.of(context).textTheme.bodyMedium,
      ),
    );
  }

  String _format(DateTime value) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${value.day}/${two(value.month)}/${value.year} '
        '${two(value.hour)}:${two(value.minute)}';
  }

  Future<void> _pick(BuildContext context) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: value ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 5),
    );
    if (date == null || !context.mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(value ?? now),
    );
    if (time == null) return;

    onChanged(
      DateTime(date.year, date.month, date.day, time.hour, time.minute),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.pen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: colors.pen.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 18, color: colors.pen),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.pen),
            ),
          ),
        ],
      ),
    );
  }
}
