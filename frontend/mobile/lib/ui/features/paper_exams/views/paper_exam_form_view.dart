import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/repositories/question_repository.dart';
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
                    'Backend sẽ sinh đề và phiếu trả lời OMR kèm theo.',
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
              Text(
                'Cấu hình chương',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Đã cấu hình ${_viewModel.configuredTotal}/${_viewModel.totalQuestions} câu.',
                style: Theme.of(context).textTheme.bodySmall,
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
                    child: AppCard(
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
                                Text(
                                  chapter.name,
                                  style: Theme.of(context).textTheme.bodyLarge,
                                ),
                                Text(
                                  'Có sẵn ${chapter.questionCount} câu',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              final current = _viewModel.getChapterQuestionCount(
                                chapter.id,
                              );
                              if (current > 0) {
                                _viewModel.setChapterQuestionCount(
                                  chapter.id,
                                  current - 1,
                                );
                              }
                            },
                            icon: const Icon(Icons.remove_circle_outline),
                            tooltip: 'Giảm',
                          ),
                          SizedBox(
                            width: 40,
                            child: Text(
                              '${_viewModel.getChapterQuestionCount(chapter.id)}',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              final current = _viewModel.getChapterQuestionCount(
                                chapter.id,
                              );
                              _viewModel.setChapterQuestionCount(
                                chapter.id,
                                current + 1,
                              );
                            },
                            icon: const Icon(Icons.add_circle_outline),
                            tooltip: 'Tăng',
                          ),
                        ],
                      ),
                    ),
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
