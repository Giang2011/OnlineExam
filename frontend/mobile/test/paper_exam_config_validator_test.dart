import 'package:flutter_test/flutter_test.dart';

import 'package:exam_mobile/domain/use_cases/paper_exam_config_validator.dart';

import 'fixtures/paper_exam_chapter_config_fixture.dart';

void main() {
  group('PaperExamConfigValidator', () {
    const validator = PaperExamConfigValidator();

    test('tổng số câu phải khớp totalQuestions', () {
      final result = validator.validateTotals(
        configs: const [
          PaperExamChapterConfigFixture.chapter1,
          PaperExamChapterConfigFixture.chapter2,
        ],
        totalQuestions: 99,
      );

      expect(result, isNotNull);
      expect(result, contains('phải bằng'));
    });

    test('tổng số câu khớp thì không báo lỗi', () {
      final result = validator.validateTotals(
        configs: const [
          PaperExamChapterConfigFixture.chapter1,
          PaperExamChapterConfigFixture.chapter2,
        ],
        totalQuestions: 10,
      );

      expect(result, isNull);
    });

    test('không cho vượt quá số câu có sẵn trong chương', () {
      final result = validator.validateCapacity(
        configs: const [PaperExamChapterConfigFixture.chapter2],
        availableByChapterId: const {1: 5, 2: 3},
        chapterNameById: const {1: 'Chương 1', 2: 'Chương 2'},
      );

      expect(result, isNotNull);
      expect(result, contains('Chương 2'));
    });

    test('phát hiện chương bị lặp', () {
      final result = validator.validateNoDuplicate(
        configs: const [
          PaperExamChapterConfigFixture.chapter1,
          PaperExamChapterConfigFixture.chapter1,
        ],
        chapterNameById: const {1: 'Chương 1'},
      );

      expect(result, isNotNull);
      expect(result, contains('nhiều lần'));
    });

    test('validateAll trả về lỗi đầu tiên tìm được', () {
      final result = validator.validateAll(
        configs: const [
          PaperExamChapterConfigFixture.chapter1,
          PaperExamChapterConfigFixture.chapter1,
        ],
        totalQuestions: 10,
        availableByChapterId: const {1: 5, 2: 5},
        chapterNameById: const {1: 'Chương 1', 2: 'Chương 2'},
      );

      expect(result, isNotNull);
      expect(result, contains('nhiều lần'));
    });

    test('validateAll không báo lỗi khi cấu hình hợp lệ', () {
      final result = validator.validateAll(
        configs: const [
          PaperExamChapterConfigFixture.chapter1,
          PaperExamChapterConfigFixture.chapter2,
        ],
        totalQuestions: 10,
        availableByChapterId: const {1: 5, 2: 5},
        chapterNameById: const {1: 'Chương 1', 2: 'Chương 2'},
      );

      expect(result, isNull);
    });
  });
}
