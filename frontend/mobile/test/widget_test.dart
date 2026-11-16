import 'package:flutter_test/flutter_test.dart';

import 'package:exam_mobile/domain/use_cases/chapter_config_validator.dart';
import 'package:exam_mobile/domain/use_cases/server_countdown.dart';

import 'fixtures/chapter_config_fixture.dart';

void main() {
  group('ChapterConfigValidator', () {
    const validator = ChapterConfigValidator();

    test('tổng số câu phải khớp totalQuestions', () {
      final result = validator.validateTotals(
        configs: const [
          ChapterConfigFixture.chapter1,
          ChapterConfigFixture.chapter2,
        ],
        totalQuestions: 99,
      );

      expect(result, isNotNull);
      expect(result, contains('phải bằng'));
    });

    test('không cho vượt quá số câu có sẵn trong chương', () {
      final result = validator.validateCapacity(
        configs: const [ChapterConfigFixture.chapter2],
        availableByChapterId: const {1: 5, 2: 3},
        chapterNameById: const {1: 'Chương 1', 2: 'Chương 2'},
      );

      expect(result, isNotNull);
      expect(result, contains('Chương 2'));
    });

    test('phát hiện chương bị lặp', () {
      final result = validator.validateNoDuplicate(
        configs: const [ChapterConfigFixture.chapter1, ChapterConfigFixture.chapter1],
        chapterNameById: const {1: 'Chương 1'},
      );

      expect(result, isNotNull);
      expect(result, contains('nhiều lần'));
    });

    test('thời gian bắt đầu phải trước thời gian kết thúc', () {
      final now = DateTime(2026, 1, 1, 10);
      final result = validator.validateTimeRange(
        startTime: now.add(const Duration(hours: 2)),
        endTime: now,
      );

      expect(result, isNotNull);
    });
  });

  group('ServerCountdown', () {
    test('đồng hồ bám theo deadlineAt của server', () {
      final serverTime = DateTime.utc(2026, 1, 1, 10, 0, 0);
      final countdown = ServerCountdown(
        serverTime: serverTime,
        deadlineAt: serverTime.add(const Duration(minutes: 30)),
        remainingSeconds: 1800,
        elapsedTicks: 0,
      );

      expect(countdown.remaining, 1800);
      expect(countdown.formatted, '30:00');
      expect(countdown.isExpired, isFalse);
    });

    test('tick làm thời gian còn lại giảm', () {
      final serverTime = DateTime.utc(2026, 1, 1, 10, 0, 0);
      final countdown = ServerCountdown(
        serverTime: serverTime,
        deadlineAt: serverTime.add(const Duration(minutes: 30)),
        remainingSeconds: 1800,
        elapsedTicks: 120, // 120 * 500ms = 60 giây
      );

      expect(countdown.remaining, 1740);
      expect(countdown.formatted, '29:00');
    });

    test('cảnh báo khi còn dưới 5 phút', () {
      final serverTime = DateTime.utc(2026, 1, 1, 10, 0, 0);
      final countdown = ServerCountdown(
        serverTime: serverTime,
        deadlineAt: serverTime.add(const Duration(minutes: 3)),
        remainingSeconds: 180,
        elapsedTicks: 0,
      );

      expect(countdown.isWarning, isTrue);
      expect(countdown.isExpired, isFalse);
    });

    test('hết giờ khi remaining <= 0', () {
      final serverTime = DateTime.utc(2026, 1, 1, 10, 0, 0);
      final countdown = ServerCountdown(
        serverTime: serverTime,
        deadlineAt: serverTime.subtract(const Duration(minutes: 1)),
        remainingSeconds: 0,
        elapsedTicks: 0,
      );

      expect(countdown.isExpired, isTrue);
    });
  });
}
