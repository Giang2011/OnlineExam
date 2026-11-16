import '../../domain/models/exam.dart';

/// Kết quả kiểm tra cấu hình chương khi tạo/sửa kỳ thi.
///
/// Backend có validate riêng nhưng FE cần validate **trước khi submit** để
/// người dùng thấy lỗi ngay thay vì chờ round-trip.
class ChapterConfigValidator {
  const ChapterConfigValidator();

  /// Kiểm tra tổng số câu khớp `totalQuestions`.
  ///
  /// Trả về thông điệp tiếng Việt, hoặc `null` nếu hợp lệ.
  String? validateTotals({
    required List<ChapterConfig> configs,
    required int totalQuestions,
  }) {
    final sum = configs.fold<int>(0, (acc, c) => acc + c.questionCount);
    if (sum != totalQuestions) {
      return 'Tổng số câu từ các chương ($sum) phải bằng số câu hỏi của kỳ thi ($totalQuestions).';
    }
    return null;
  }

  /// Kiểm tra mỗi chương không yêu cầu nhiều câu hơn số câu đang có.
  String? validateCapacity({
    required List<ChapterConfig> configs,
    required Map<int, int> availableByChapterId,
    required Map<int, String> chapterNameById,
  }) {
    for (final config in configs) {
      final available = availableByChapterId[config.chapterId];
      if (available == null) continue;
      if (config.questionCount > available) {
        final name = chapterNameById[config.chapterId] ?? 'Chương';
        return "Chương '$name' chỉ có $available câu hỏi, nhưng yêu cầu ${config.questionCount} câu.";
      }
    }
    return null;
  }

  /// Kiểm tra không có chương nào bị lặp.
  String? validateNoDuplicate({
    required List<ChapterConfig> configs,
    required Map<int, String> chapterNameById,
  }) {
    final seen = <int>{};
    for (final config in configs) {
      if (!seen.add(config.chapterId)) {
        final name = chapterNameById[config.chapterId] ?? 'Chương';
        return "Chương '$name' xuất hiện nhiều lần trong cấu hình.";
      }
    }
    return null;
  }

  /// Kiểm tra thời gian bắt đầu / kết thúc.
  String? validateTimeRange({
    required DateTime? startTime,
    required DateTime? endTime,
  }) {
    if (startTime == null || endTime == null) {
      return 'Thời gian bắt đầu và thời gian kết thúc không được để trống.';
    }
    if (!startTime.isBefore(endTime)) {
      return 'Thời gian bắt đầu phải trước thời gian kết thúc.';
    }
    return null;
  }

  /// Kiểm tra toàn bộ — trả về lỗi đầu tiên tìm được.
  String? validateAll({
    required List<ChapterConfig> configs,
    required int totalQuestions,
    required Map<int, int> availableByChapterId,
    required Map<int, String> chapterNameById,
    required DateTime? startTime,
    required DateTime? endTime,
  }) {
    return validateNoDuplicate(configs: configs, chapterNameById: chapterNameById) ??
        validateTotals(configs: configs, totalQuestions: totalQuestions) ??
        validateCapacity(
          configs: configs,
          availableByChapterId: availableByChapterId,
          chapterNameById: chapterNameById,
        ) ??
        validateTimeRange(startTime: startTime, endTime: endTime);
  }
}
