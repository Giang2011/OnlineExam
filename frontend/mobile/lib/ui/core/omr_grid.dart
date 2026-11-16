import 'package:material_ui/material_ui.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

/// Lưới điều hướng kiểu phiếu OMR — **yếu tố nhớ duy nhất của sản phẩm**.
///
/// Ô vuông theo số câu, tô đậm khi đã trả lời. Vuông là "đã chọn",
/// vuông rỗng là "chưa trả lời", viền đỏ là câu đang xem.
class OmrGrid extends StatelessWidget {
  const OmrGrid({
    super.key,
    required this.totalQuestions,
    required this.answeredIndexes,
    required this.currentIndex,
    this.onTap,
    this.scrollController,
  });

  final int totalQuestions;

  /// Tập index (0-based) của các câu đã có đáp án.
  final Set<int> answeredIndexes;

  /// Index (0-based) của câu đang xem.
  final int currentIndex;
  final ValueChanged<int>? onTap;
  final ScrollController? scrollController;

  @override
  Widget build(BuildContext context) {
    final colors = context.examColors;

    return GridView.builder(
      controller: scrollController,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 44,
        mainAxisSpacing: AppSpacing.sm,
        crossAxisSpacing: AppSpacing.sm,
        childAspectRatio: 1,
      ),
      itemCount: totalQuestions,
      itemBuilder: (context, index) {
        final isCurrent = index == currentIndex;
        final isAnswered = answeredIndexes.contains(index);

        return InkWell(
          onTap: onTap == null ? null : () => onTap!(index),
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isAnswered ? colors.chalk : colors.paperElevated,
              borderRadius: BorderRadius.circular(AppRadius.sm),
              border: Border.all(
                color: isCurrent
                    ? colors.pen
                    : isAnswered
                    ? colors.chalk
                    : colors.hairline,
                width: isCurrent ? 2 : 1,
              ),
            ),
            child: Text(
              '${index + 1}',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: isAnswered ? Colors.white : colors.slate,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        );
      },
    );
  }
}
