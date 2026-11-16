import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../core/network_image_view.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/question_form_view_model.dart';

/// Form soạn / sửa câu hỏi.
class QuestionFormView extends StatefulWidget {
  const QuestionFormView({super.key, this.questionId});

  final int? questionId;

  @override
  State<QuestionFormView> createState() => _QuestionFormViewState();
}

class _QuestionFormViewState extends State<QuestionFormView> {
  late final QuestionFormViewModel _viewModel;
  final _contentController = TextEditingController();
  final _answerControllers = <int, TextEditingController>{};

  @override
  void initState() {
    super.initState();
    _viewModel = QuestionFormViewModel(
      repository: context.read<QuestionRepository>(),
      questionId: widget.questionId,
    );
    _viewModel.init().then((_) {
      if (!mounted) return;
      _contentController.text = _viewModel.content;
      for (var i = 0; i < _viewModel.answers.length; i++) {
        _answerControllers[i] = TextEditingController(
          text: _viewModel.answers[i].content,
        );
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    _contentController.dispose();
    for (final controller in _answerControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.questionId == null ? 'Thêm câu hỏi' : 'Sửa câu hỏi'),
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const LoadingView(message: 'Đang tải…');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: widget.questionId == null
                    ? 'Thêm câu hỏi'
                    : 'Sửa câu hỏi',
                description:
                    'Backend yêu cầu ít nhất 2 đáp án và có ít nhất 1 đáp án đúng.',
              ),
              TextField(
                controller: _contentController,
                minLines: 2,
                maxLines: 6,
                onChanged: _viewModel.setContent,
                decoration: const InputDecoration(
                  labelText: 'Nội dung câu hỏi',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _ImagePickerField(
                label: 'Ảnh minh họa câu hỏi',
                previewUrl: _viewModel.questionImagePreview,
                onPick: _pickQuestionImage,
                onRemove: _viewModel.removeQuestionImage,
              ),
              const SizedBox(height: AppSpacing.lg),
              DropdownButtonFormField<int?>(
                initialValue: _viewModel.subjectId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Môn học'),
                items: [
                  for (final subject in _viewModel.subjects)
                    DropdownMenuItem(value: subject.id, child: Text(subject.name)),
                ],
                onChanged: _viewModel.setSubject,
              ),
              const SizedBox(height: AppSpacing.md),
              DropdownButtonFormField<int?>(
                initialValue: _viewModel.chapterId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Chương'),
                items: [
                  for (final chapter in _viewModel.chapters)
                    DropdownMenuItem(value: chapter.id, child: Text(chapter.name)),
                ],
                onChanged: _viewModel.setChapter,
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Đáp án',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      _viewModel.addAnswer();
                      _answerControllers[_viewModel.answers.length - 1] =
                          TextEditingController();
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Thêm đáp án'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              for (var i = 0; i < _viewModel.answers.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: _AnswerEditor(
                    index: i,
                    controller: _answerControllers[i],
                    answer: _viewModel.answers[i],
                    canRemove: _viewModel.answers.length > 2,
                    onContentChanged: (value) =>
                        _viewModel.updateAnswer(i, content: value),
                    onCorrectChanged: (value) =>
                        _viewModel.updateAnswer(i, isCorrect: value),
                    onPickImage: (path) => _viewModel.setAnswerImage(i, path),
                    onRemoveImage: () => _viewModel.removeAnswerImage(i),
                    onRemove: () {
                      _viewModel.removeAnswer(i);
                      _answerControllers.remove(i)?.dispose();
                    },
                  ),
                ),
              if (_viewModel.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  _viewModel.errorMessage!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.pen,
                  ),
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
                    : Text(widget.questionId == null ? 'Tạo câu hỏi' : 'Lưu'),
              ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _pickQuestionImage() async {
    final path = await _pickImage();
    if (path != null) _viewModel.setQuestionImage(path);
  }

  Future<String?> _pickImage() async {
    final picker = ImagePicker();
    final result = await picker.pickImage(source: ImageSource.gallery);
    return result?.path;
  }

  Future<void> _handleSubmit() async {
    final ok = await _viewModel.submit();
    if (!mounted) return;

    if (ok) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã lưu câu hỏi.')));
      context.go('/questions');
    }
  }
}

class _ImagePickerField extends StatelessWidget {
  const _ImagePickerField({
    required this.label,
    required this.previewUrl,
    required this.onPick,
    required this.onRemove,
  });

  final String label;
  final String? previewUrl;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(label, style: Theme.of(context).textTheme.labelMedium),
            ),
            TextButton.icon(
              onPressed: onPick,
              icon: const Icon(Icons.image_outlined),
              label: const Text('Chọn ảnh'),
            ),
            if (previewUrl != null)
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Xoá ảnh',
              ),
          ],
        ),
        if (previewUrl != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: NetworkImageView(imageUrl: previewUrl, height: 160),
          ),
      ],
    );
  }
}

class _AnswerEditor extends StatelessWidget {
  const _AnswerEditor({
    required this.index,
    required this.controller,
    required this.answer,
    required this.canRemove,
    required this.onContentChanged,
    required this.onCorrectChanged,
    required this.onPickImage,
    required this.onRemoveImage,
    required this.onRemove,
  });

  final int index;
  final TextEditingController? controller;
  final AnswerDraft answer;
  final bool canRemove;
  final ValueChanged<String> onContentChanged;
  final ValueChanged<bool> onCorrectChanged;
  final ValueChanged<String> onPickImage;
  final VoidCallback onRemoveImage;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: answer.isCorrect ? colors.jade : null,
      child: Column(
        children: [
          Row(
            children: [
              Checkbox(
                value: answer.isCorrect,
                onChanged: (value) => onCorrectChanged(value ?? false),
              ),
              Expanded(
                child: TextField(
                  controller: controller,
                  onChanged: onContentChanged,
                  decoration: InputDecoration(
                    labelText: 'Đáp án ${index + 1}',
                    hintText: 'Nội dung đáp án',
                  ),
                ),
              ),
              if (canRemove)
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.remove_circle_outline),
                  tooltip: 'Xoá đáp án',
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              TextButton.icon(
                onPressed: () async {
                  final picker = ImagePicker();
                  final result = await picker.pickImage(
                    source: ImageSource.gallery,
                  );
                  if (result != null) onPickImage(result.path);
                },
                icon: const Icon(Icons.image_outlined),
                label: const Text('Ảnh đáp án'),
              ),
              if (answer.previewUrl != null)
                IconButton(
                  onPressed: onRemoveImage,
                  icon: const Icon(Icons.delete_outline),
                  tooltip: 'Xoá ảnh',
                ),
            ],
          ),
          if (answer.previewUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.sm),
              child: NetworkImageView(imageUrl: answer.previewUrl, height: 110),
            ),
        ],
      ),
    );
  }
}
