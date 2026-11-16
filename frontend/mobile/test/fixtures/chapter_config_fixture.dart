import 'package:exam_mobile/domain/models/exam.dart';

/// Fixture dùng chung cho test — tránh phải mock model.
abstract final class ChapterConfigFixture {
  static const chapter1 = ChapterConfig(chapterId: 1, questionCount: 5);
  static const chapter2 = ChapterConfig(chapterId: 2, questionCount: 5);
}
