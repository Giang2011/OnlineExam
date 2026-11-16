import 'package:meta/meta.dart';

/// Trạng thái phiên thi.
enum SessionStatus {
  doing('DOING'),
  submitted('SUBMITTED');

  const SessionStatus(this.wire);

  final String wire;

  static SessionStatus fromWire(String? value) {
    for (final status in SessionStatus.values) {
      if (status.wire == value) return status;
    }
    return SessionStatus.doing;
  }
}

/// Nguồn nộp bài — `null` khi phiên vừa tạo (chưa nộp).
@immutable
class SubmitSource {
  const SubmitSource(this.wire);

  /// `MANUAL` | `TIMEOUT` | `GRACE` | `RESUME`.
  final String wire;

  String get label => switch (wire) {
    'MANUAL' => 'Bạn đã nộp bài.',
    'TIMEOUT' => 'Hết giờ — hệ thống đã tự nộp bài.',
    'GRACE' => 'Bạn nộp bài hơi muộn — vẫn được chấp nhận.',
    'RESUME' => 'Tiếp tục phiên thi đã dở.',
    _ => 'Đã nộp bài.',
  };

  static SubmitSource? fromWire(String? value) =>
      value == null ? null : SubmitSource(value);
}

/// Phiên thi — server là nguồn sự thật về thời gian.
@immutable
class ExamSession {
  const ExamSession({
    required this.id,
    required this.examId,
    required this.examTitle,
    required this.userName,
    required this.startTime,
    required this.status,
    required this.attemptNo,
    required this.deadlineAt,
    required this.serverTime,
    required this.remainingSeconds,
    this.endTime,
    this.submitSource,
    this.score,
    this.totalCorrect,
    this.totalQuestions,
    this.maxAttempts,
    this.attemptsExhausted = false,
  });

  final int id;
  final int examId;
  final String examTitle;
  final String userName;
  final String startTime;
  final String? endTime;
  final SessionStatus status;
  final int attemptNo;
  final String deadlineAt;
  final String serverTime;
  final int remainingSeconds;
  final SubmitSource? submitSource;

  /// Điểm (thang 10) — backend trả kèm trong response submit.
  final double? score;
  final int? totalCorrect;
  final int? totalQuestions;
  final int? maxAttempts;
  final bool attemptsExhausted;

  factory ExamSession.fromJson(Map<String, dynamic> json) {
    return ExamSession(
      id: ((json['id'] ?? json['sessionId']) as num?)?.toInt() ?? 0,
      examId: (json['examId'] as num?)?.toInt() ?? 0,
      examTitle: json['examTitle'] as String? ?? '',
      userName: json['userName'] as String? ?? '',
      startTime: json['startTime'] as String? ?? '',
      endTime: json['endTime'] as String?,
      status: SessionStatus.fromWire(json['status'] as String?),
      attemptNo: (json['attemptNo'] as num?)?.toInt() ?? 1,
      deadlineAt: json['deadlineAt'] as String? ?? '',
      serverTime: json['serverTime'] as String? ?? '',
      remainingSeconds: (json['remainingSeconds'] as num?)?.toInt() ?? 0,
      submitSource: SubmitSource.fromWire(json['submitSource'] as String?),
      score: (json['score'] as num?)?.toDouble(),
      totalCorrect: (json['totalCorrect'] as num?)?.toInt(),
      totalQuestions: (json['totalQuestions'] as num?)?.toInt(),
      maxAttempts: (json['maxAttempts'] as num?)?.toInt(),
      attemptsExhausted: json['attemptsExhausted'] as bool? ?? false,
    );
  }
}

/// Phiên thi đang diễn ra — shape riêng của `GET /sessions/active`.
@immutable
class ActiveSession {
  const ActiveSession({
    required this.sessionId,
    required this.examId,
    required this.examTitle,
    required this.attemptNo,
    required this.status,
    required this.startTime,
    required this.deadlineAt,
    required this.serverTime,
    required this.remainingSeconds,
  });

  final int sessionId;
  final int examId;
  final String examTitle;
  final int attemptNo;
  final SessionStatus status;
  final String startTime;
  final String deadlineAt;
  final String serverTime;
  final int remainingSeconds;

  factory ActiveSession.fromJson(Map<String, dynamic> json) {
    return ActiveSession(
      sessionId: (json['sessionId'] as num).toInt(),
      examId: (json['examId'] as num?)?.toInt() ?? 0,
      examTitle: json['examTitle'] as String? ?? '',
      attemptNo: (json['attemptNo'] as num?)?.toInt() ?? 1,
      status: SessionStatus.fromWire(json['status'] as String?),
      startTime: json['startTime'] as String? ?? '',
      deadlineAt: json['deadlineAt'] as String? ?? '',
      serverTime: json['serverTime'] as String? ?? '',
      remainingSeconds: (json['remainingSeconds'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Đáp án trong đề thi của phiên — **không có** `isCorrect`.
@immutable
class SessionAnswer {
  const SessionAnswer({
    required this.answerId,
    required this.content,
    required this.orderIndex,
    this.imageUrl,
  });

  final int answerId;
  final String content;
  final String? imageUrl;
  final int orderIndex;

  factory SessionAnswer.fromJson(Map<String, dynamic> json) {
    return SessionAnswer(
      answerId: (json['answerId'] as num).toInt(),
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Câu hỏi trong đề thi của phiên.
@immutable
class SessionQuestion {
  const SessionQuestion({
    required this.variantQuestionId,
    required this.content,
    required this.orderIndex,
    required this.isMultipleChoice,
    required this.answers,
    this.imageUrl,
  });

  final int variantQuestionId;
  final String content;
  final String? imageUrl;
  final int orderIndex;

  /// `true` nếu câu có nhiều đáp án đúng.
  final bool isMultipleChoice;
  final List<SessionAnswer> answers;

  factory SessionQuestion.fromJson(Map<String, dynamic> json) {
    final raw = json['answers'] as List<dynamic>? ?? const [];
    return SessionQuestion(
      variantQuestionId: (json['variantQuestionId'] as num).toInt(),
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      isMultipleChoice: json['isMultipleChoice'] as bool? ?? false,
      answers: raw
          .map((e) => SessionAnswer.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

/// Một đáp án đã chọn — payload gửi lên server.
@immutable
class SelectedAnswer {
  const SelectedAnswer({
    required this.variantQuestionId,
    required this.selectedAnswerIds,
  });

  final int variantQuestionId;
  final List<int> selectedAnswerIds;

  factory SelectedAnswer.fromJson(Map<String, dynamic> json) {
    final ids = json['selectedAnswerIds'] as List<dynamic>? ?? const [];
    return SelectedAnswer(
      variantQuestionId: (json['variantQuestionId'] as num).toInt(),
      selectedAnswerIds: ids.map((e) => (e as num).toInt()).toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
    'variantQuestionId': variantQuestionId,
    'selectedAnswerIds': selectedAnswerIds,
  };
}

/// Draft đáp án của phiên — `GET/PUT /sessions/{id}/answers`.
@immutable
class AnswerDraft {
  const AnswerDraft({required this.sessionId, required this.answers});

  final int sessionId;
  final List<SelectedAnswer> answers;

  factory AnswerDraft.fromJson(Map<String, dynamic> json) {
    final raw = json['answers'] as List<dynamic>? ?? const [];
    return AnswerDraft(
      sessionId: (json['sessionId'] as num?)?.toInt() ?? 0,
      answers: raw
          .map((e) => SelectedAnswer.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
    'answers': answers.map((a) => a.toJson()).toList(),
  };
}
