import 'package:meta/meta.dart';

import 'app_user.dart';

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

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'chapters': chapters.map((c) => c.toJson()).toList(),
  };
}

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

  Map<String, dynamic> toJson() => {
    'id': id,
    'subjectId': subjectId,
    'name': name,
    'questionCount': questionCount,
  };
}

/// Đáp án kèm cờ đúng — chỉ dùng ở màn ngân hàng câu hỏi (giáo viên).
@immutable
class Answer {
  const Answer({
    this.id,
    required this.content,
    this.imageUrl,
    this.isCorrect = false,
    this.imageRemoved = false,
  });

  final int? id;
  final String content;
  final String? imageUrl;
  final bool isCorrect;

  /// Cờ xoá ảnh cũ khi PUT (chỉ áp dụng cho form giáo viên).
  final bool imageRemoved;

  factory Answer.fromJson(Map<String, dynamic> json) {
    return Answer(
      id: (json['id'] as num?)?.toInt(),
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      isCorrect: json['isCorrect'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    if (id != null) 'id': id,
    'content': content,
    if (imageUrl != null) 'imageUrl': imageUrl,
    'isCorrect': isCorrect,
    if (imageRemoved) 'imageRemoved': true,
  };
}

@immutable
class Question {
  const Question({
    required this.id,
    required this.content,
    required this.subjectId,
    required this.subjectName,
    required this.chapterId,
    required this.chapterName,
    required this.answers,
    this.imageUrl,
    this.createdAt,
  });

  final int id;
  final String content;
  final String? imageUrl;
  final int subjectId;
  final String subjectName;
  final int chapterId;
  final String chapterName;
  final List<Answer> answers;
  final String? createdAt;

  factory Question.fromJson(Map<String, dynamic> json) {
    final rawAnswers = json['answers'] as List<dynamic>? ?? const [];
    return Question(
      id: (json['id'] as num).toInt(),
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      subjectId: (json['subjectId'] as num?)?.toInt() ?? 0,
      subjectName: json['subjectName'] as String? ?? '',
      chapterId: (json['chapterId'] as num?)?.toInt() ?? 0,
      chapterName: json['chapterName'] as String? ?? '',
      createdAt: json['createdAt'] as String?,
      answers: rawAnswers
          .map((e) => Answer.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

/// Trang kết quả phân trang kiểu Spring `Page`.
@immutable
class PageResult<T> {
  const PageResult({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.number,
    required this.size,
  });

  final List<T> content;
  final int totalElements;
  final int totalPages;
  final int number;
  final int size;

  bool get isEmpty => content.isEmpty;

  factory PageResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) parse,
  ) {
    final raw = json['content'] as List<dynamic>? ?? const [];
    return PageResult(
      content: raw
          .map((e) => parse(e as Map<String, dynamic>))
          .toList(growable: false),
      totalElements: (json['totalElements'] as num?)?.toInt() ?? 0,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
      number: (json['number'] as num?)?.toInt() ?? 0,
      size: (json['size'] as num?)?.toInt() ?? 20,
    );
  }
}

/// Kết quả tạo học sinh — username/password chỉ trả về **đúng 1 lần**.
@immutable
class CreatedCredentials {
  const CreatedCredentials({
    required this.id,
    required this.studentId,
    required this.name,
    required this.username,
    required this.password,
  });

  final int id;
  final String studentId;
  final String name;
  final String username;
  final String password;

  factory CreatedCredentials.fromJson(Map<String, dynamic> json) {
    return CreatedCredentials(
      id: (json['id'] as num).toInt(),
      studentId: json['studentId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      username: json['username'] as String? ?? '',
      password: json['password'] as String? ?? '',
    );
  }
}

/// Đáp án trả về trong danh sách thí sinh — backend dùng chung shape với `GET /users`.
typedef ParticipantUser = AppUser;
