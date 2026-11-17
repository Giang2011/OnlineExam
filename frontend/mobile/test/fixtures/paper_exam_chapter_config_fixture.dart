import 'package:exam_mobile/domain/models/paper_exam.dart';

/// Fixture dùng chung cho test — tránh phải mock model.
abstract final class PaperExamChapterConfigFixture {
  static const chapter1 = PaperExamChapterConfig(
    chapterId: 1,
    chapterName: 'Chương 1',
    questionCount: 5,
  );

  static const chapter2 = PaperExamChapterConfig(
    chapterId: 2,
    chapterName: 'Chương 2',
    questionCount: 5,
  );
}
