import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/user_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/app_user.dart';
import '../../../../domain/models/exam.dart';
import '../../../core/page_header.dart';
import '../../../core/state_views.dart';
import '../view_models/exam_detail_view_model.dart';

/// Chi tiết kỳ thi — thông tin + danh sách thí sinh.
class ExamDetailView extends StatefulWidget {
  const ExamDetailView({super.key, required this.examId});

  final int examId;

  @override
  State<ExamDetailView> createState() => _ExamDetailViewState();
}

class _ExamDetailViewState extends State<ExamDetailView> {
  late final ExamDetailViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = ExamDetailViewModel(
      examRepository: context.read<ExamRepository>(),
      userRepository: context.read<UserRepository>(),
      examId: widget.examId,
    );
    _viewModel.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết kỳ thi')),
      body: ListenableBuilder(
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

          final exam = _viewModel.exam;
          if (exam == null) {
            return const EmptyView(title: 'Không tìm thấy kỳ thi');
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              PageHeader(
                title: exam.title,
                description: exam.subjectName,
                actions: [
                  if (exam.status == ExamStatus.upcoming)
                    OutlinedButton.icon(
                      onPressed: () => context.go('/exams/${exam.id}/edit'),
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Sửa'),
                    ),
                ],
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
                          label: exam.status.label,
                          icon: Icons.event_outlined,
                        ),
                        InfoChip(
                          label: '${exam.totalQuestions} câu',
                          icon: Icons.help_outline,
                        ),
                        InfoChip(
                          label: '${exam.duration} phút',
                          icon: Icons.schedule,
                        ),
                        InfoChip(
                          label: '${exam.totalVariants} đề',
                          icon: Icons.copy_all_outlined,
                        ),
                        InfoChip(
                          label: 'Tối đa ${exam.maxAttempts} lượt',
                          icon: Icons.replay,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    const Divider(),
                    const SizedBox(height: AppSpacing.md),
                    _TimeRow(label: 'Bắt đầu', value: exam.startTime),
                    const SizedBox(height: AppSpacing.sm),
                    _TimeRow(label: 'Kết thúc', value: exam.endTime),
                    const SizedBox(height: AppSpacing.lg),
                    FilledButton.tonalIcon(
                      onPressed: () => context.go('/results/${exam.id}'),
                      icon: const Icon(Icons.leaderboard_outlined),
                      label: const Text('Xem bảng điểm'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Thí sinh (${_viewModel.participants.length})',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: _openAddParticipant,
                    icon: const Icon(Icons.person_add_alt),
                    label: const Text('Gán thí sinh'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              if (_viewModel.participants.isEmpty)
                const EmptyView(
                  title: 'Chưa có thí sinh',
                  description: 'Gán thí sinh để họ có thể làm bài kỳ thi này.',
                  icon: Icons.group_outlined,
                )
              else
                for (final participant in _viewModel.participants)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: _ParticipantTile(
                      participant: participant,
                      canRemove: exam.status == ExamStatus.upcoming,
                      onRemove: () => _confirmRemove(participant),
                    ),
                  ),
            ],
          );
        },
      ),
      backgroundColor: colors.paper,
    );
  }

  Future<void> _openAddParticipant() async {
    await _viewModel.loadCandidates();
    if (!mounted) return;

    final available = _viewModel.availableStudents;
    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không còn học sinh nào để gán.')),
      );
      return;
    }

    final selected = await showModalBottomSheet<AppUser>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                'Chọn thí sinh',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
            ),
            for (final student in available)
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text(student.name),
                subtitle: student.studentId != null
                    ? Text(student.studentId!)
                    : null,
                onTap: () => Navigator.of(context).pop(student),
              ),
          ],
        ),
      ),
    );

    if (selected == null) return;

    try {
      await _viewModel.addParticipant(selected.id);
    } on ApiError catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _confirmRemove(AppUser participant) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Gỡ thí sinh?'),
        content: Text('Gỡ "${participant.name}" khỏi kỳ thi này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Gỡ'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _viewModel.removeParticipant(participant.id);
    } on ApiError catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}

class _TimeRow extends StatelessWidget {
  const _TimeRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 96,
          child: Text(label, style: theme.textTheme.bodySmall),
        ),
        Expanded(
          child: Text(
            value.isEmpty ? '—' : value,
            style: theme.textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}

class _ParticipantTile extends StatelessWidget {
  const _ParticipantTile({
    required this.participant,
    required this.canRemove,
    required this.onRemove,
  });

  final AppUser participant;
  final bool canRemove;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Icon(Icons.person_outline, color: context.examColors.slate),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  participant.name,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (participant.studentId != null)
                  Text(
                    participant.studentId!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
          ),
          if (canRemove)
            IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.person_remove_outlined),
              tooltip: 'Gỡ thí sinh',
            ),
        ],
      ),
    );
  }
}
