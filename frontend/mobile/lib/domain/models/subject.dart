import 'package:meta/meta.dart';

/// Môn học — dùng cho form tạo đề giấy (chọn môn → chọn chương).
@immutable
class Subject {
  const Subject({
    required this.id,
    required this.name,
    this.chapters = const [],
  });

  final int id;
  final String name;
  final List<Chapter> chapters;

  factory Subject.fromJson(Map<String, dynamic> json) {
    final rawChapters = json['chapters'] as List<dynamic>? ?? const [];
    return Subject(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      chapters: rawChapters
          .map((e) => Chapter.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

/// Chương của một môn học.
@immutable
class Chapter {
  const Chapter({
    required this.id,
    required this.subjectId,
    required this.name,
    required this.questionCount,
  });

  final int id;
  final int subjectId;
  final String name;

  /// Số câu hỏi hiện có trong chương — dùng để chặn cấu hình vượt quá.
  final int questionCount;

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: (json['id'] as num).toInt(),
      subjectId: (json['subjectId'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? '',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
    );
  }
}
