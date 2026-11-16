import 'package:meta/meta.dart';

/// Trạng thái kỳ thi — **do backend tính**, FE không suy diễn.
enum ExamStatus {
  upcoming('UPCOMING'),
  ongoing('ONGOING'),
  completed('COMPLETED');

  const ExamStatus(this.wire);

  final String wire;

  static ExamStatus fromWire(String? value) {
    for (final status in ExamStatus.values) {
      if (status.wire == value) return status;
    }
    return ExamStatus.upcoming;
  }

  String get label => switch (this) {
    ExamStatus.upcoming => 'Sắp diễn ra',
    ExamStatus.ongoing => 'Đang diễn ra',
    ExamStatus.completed => 'Đã kết thúc',
  };
}

@immutable
class Exam {
  const Exam({
    required this.id,
    required this.title,
    required this.subjectId,
    required this.subjectName,
    required this.duration,
    required this.totalQuestions,
    required this.totalVariants,
    required this.maxAttempts,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.participantCount = 0,
  });

  final int id;
  final String title;
  final int subjectId;
  final String subjectName;

  /// Thời lượng (phút).
  final int duration;
  final int totalQuestions;
  final int totalVariants;
  final int maxAttempts;
  final String startTime;
  final String endTime;
  final ExamStatus status;
  final int participantCount;

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      subjectId: (json['subjectId'] as num?)?.toInt() ?? 0,
      subjectName: json['subjectName'] as String? ?? '',
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      totalVariants: (json['totalVariants'] as num?)?.toInt() ?? 1,
      maxAttempts: (json['maxAttempts'] as num?)?.toInt() ?? 1,
      startTime: json['startTime'] as String? ?? '',
      endTime: json['endTime'] as String? ?? '',
      status: ExamStatus.fromWire(json['status'] as String?),
      participantCount: (json['participantCount'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Cấu hình số câu theo chương khi tạo / sửa kỳ thi.
@immutable
class ChapterConfig {
  const ChapterConfig({required this.chapterId, required this.questionCount});

  final int chapterId;
  final int questionCount;

  factory ChapterConfig.fromJson(Map<String, dynamic> json) {
    return ChapterConfig(
      chapterId: (json['chapterId'] as num).toInt(),
      questionCount: (json['questionCount'] as num).toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
    'chapterId': chapterId,
    'questionCount': questionCount,
  };
}

/// Payload tạo / sửa kỳ thi.
@immutable
class ExamRequest {
  const ExamRequest({
    required this.title,
    required this.subjectId,
    required this.duration,
    required this.totalQuestions,
    required this.totalVariants,
    required this.maxAttempts,
    required this.chapterConfigs,
    required this.startTime,
    required this.endTime,
  });

  final String title;
  final int subjectId;
  final int duration;
  final int totalQuestions;
  final int totalVariants;
  final int maxAttempts;
  final List<ChapterConfig> chapterConfigs;
  final String startTime;
  final String endTime;

  Map<String, dynamic> toJson() => {
    'title': title,
    'subjectId': subjectId,
    'duration': duration,
    'totalQuestions': totalQuestions,
    'totalVariants': totalVariants,
    'maxAttempts': maxAttempts,
    'chapterConfigs': chapterConfigs.map((c) => c.toJson()).toList(),
    'startTime': startTime,
    'endTime': endTime,
  };
}
