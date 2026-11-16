import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../../domain/models/question.dart';
import '../../../core/network_image_view.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/question_list_view_model.dart';

/// Danh sách câu hỏi trong ngân hàng.
class QuestionListView extends StatefulWidget {
  const QuestionListView({super.key});

  @override
  State<QuestionListView> createState() => _QuestionListViewState();
}

class _QuestionListViewState extends State<QuestionListView> {
  late final QuestionListViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = QuestionListViewModel(context.read<QuestionRepository>());
    _viewModel.init();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: _viewModel,
          builder: (context, _) {
            if (_viewModel.isLoading && _viewModel.page.content.isEmpty) {
              return const LoadingView(message: 'Đang tải ngân hàng câu hỏi…');
            }
            if (_viewModel.errorMessage != null) {
              return ErrorView(
                message: _viewModel.errorMessage!,
                onRetry: _viewModel.load,
              );
            }

            final page = _viewModel.page;

            return RefreshIndicator(
              onRefresh: _viewModel.load,
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  PageHeader(
                    title: 'Ngân hàng câu hỏi',
                    description: 'Tổng ${page.totalElements} câu hỏi.',
                    actions: [
                      FilledButton.icon(
                        onPressed: () => context.go('/questions/new'),
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm câu hỏi'),
                      ),
                    ],
                  ),
                  _FilterRow(viewModel: _viewModel),
                  const SizedBox(height: AppSpacing.md),
                  if (page.content.isEmpty)
                    const EmptyView(
                      title: 'Không có câu hỏi',
                      description: 'Thử đổi bộ lọc hoặc thêm câu hỏi mới.',
                      icon: Icons.help_outline,
                    )
                  else
                    for (final question in page.content)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: _QuestionCard(
                          question: question,
                          onDelete: () => _confirmDelete(question),
                        ),
                      ),
                  if (page.totalPages > 1) ...[
                    const SizedBox(height: AppSpacing.sm),
                    _Pagination(
                      pageIndex: _viewModel.pageIndex,
                      totalPages: page.totalPages,
                      onChanged: _viewModel.goToPage,
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _confirmDelete(Question question) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xoá câu hỏi?'),
        content: const Text(
          'Câu hỏi sẽ bị xoá khỏi ngân hàng. Thao tác này không thể hoàn tác.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Xoá'),
          ),
        ],
      ),
    );

    if (confirmed == true) await _viewModel.delete(question.id);
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({required this.viewModel});

  final QuestionListViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          onSubmitted: viewModel.setKeyword,
          decoration: const InputDecoration(
            labelText: 'Tìm theo nội dung',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<int?>(
                initialValue: viewModel.subjectId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Môn học'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Tất cả')),
                  for (final subject in viewModel.subjects)
                    DropdownMenuItem(value: subject.id, child: Text(subject.name)),
                ],
                onChanged: viewModel.setSubject,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: DropdownButtonFormField<int?>(
                initialValue: viewModel.chapterId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Chương'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Tất cả')),
                  for (final chapter in viewModel.chapters)
                    DropdownMenuItem(value: chapter.id, child: Text(chapter.name)),
                ],
                onChanged: viewModel.setChapter,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({required this.question, required this.onDelete});

  final Question question;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;
    final theme = Theme.of(context);

    return AppCard(
      onTap: () => context.go('/questions/${question.id}/edit'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(question.content, style: theme.textTheme.bodyLarge),
          if (question.imageUrl != null) ...[
            const SizedBox(height: AppSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.sm),
              child: NetworkImageView(imageUrl: question.imageUrl, height: 140),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              InfoChip(label: question.subjectName, icon: Icons.folder_outlined),
              InfoChip(label: question.chapterName, icon: Icons.book_outlined),
              InfoChip(
                label: '${question.answers.length} đáp án',
                icon: Icons.list_alt_outlined,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: Text(
                  question.createdAt ?? '',
                  style: theme.textTheme.bodySmall,
                ),
              ),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline),
                tooltip: 'Xoá câu hỏi',
                color: colors.slate,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.pageIndex,
    required this.totalPages,
    required this.onChanged,
  });

  final int pageIndex;
  final int totalPages;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: pageIndex > 0 ? () => onChanged(pageIndex - 1) : null,
          icon: const Icon(Icons.chevron_left),
          tooltip: 'Trang trước',
        ),
        Text(
          'Trang ${pageIndex + 1}/$totalPages',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        IconButton(
          onPressed: pageIndex < totalPages - 1
              ? () => onChanged(pageIndex + 1)
              : null,
          icon: const Icon(Icons.chevron_right),
          tooltip: 'Trang sau',
        ),
      ],
    );
  }
}
