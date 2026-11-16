import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/exam_repository.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/results_view_models.dart';

/// Chọn kỳ thi để xem bảng điểm.
class ResultsExamPickerView extends StatefulWidget {
  const ResultsExamPickerView({super.key});

  @override
  State<ResultsExamPickerView> createState() => _ResultsExamPickerViewState();
}

class _ResultsExamPickerViewState extends State<ResultsExamPickerView> {
  late final ResultsExamPickerViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ResultsExamPickerViewModel(context.read<ExamRepository>());
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      body: SafeArea(
        child: ListenableBuilder(
          listenable: _viewModel,
          builder: (context, _) {
            if (_viewModel.isLoading) {
              return const LoadingView(message: 'Đang tải kỳ thi…');
            }
            if (_viewModel.errorMessage != null) {
              return ErrorView(
                message: _viewModel.errorMessage!,
                onRetry: _viewModel.load,
              );
            }

            return ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: [
                const PageHeader(
                  title: 'Bảng điểm',
                  description: 'Chọn kỳ thi để xem kết quả chi tiết.',
                ),
                if (_viewModel.exams.isEmpty)
                  const EmptyView(
                    title: 'Chưa có kỳ thi',
                    icon: Icons.assignment_outlined,
                  )
                else
                  for (final exam in _viewModel.exams)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: AppCard(
                        onTap: () => context.go('/results/${exam.id}'),
                        child: Row(
                          children: [
                            Icon(
                              Icons.assignment_outlined,
                              color: colors.slate,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    exam.title,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleSmall,
                                  ),
                                  Text(
                                    '${exam.subjectName} • ${exam.totalQuestions} câu',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                      ),
                    ),
              ],
            );
          },
        ),
      ),
      backgroundColor: colors.paper,
    );
  }
}
