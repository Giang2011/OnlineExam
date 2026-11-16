import 'package:meta/meta.dart';

/// Cấu hình chương trong đề giấy.
@immutable
class PaperExamChapterConfig {
  const PaperExamChapterConfig({
    this.id,
    required this.chapterId,
    required this.chapterName,
    required this.questionCount,
  });

  /// ID cấu hình — chỉ có trong response.
  final int? id;
  final int chapterId;
  final String chapterName;
  final int questionCount;

  factory PaperExamChapterConfig.fromJson(Map<String, dynamic> json) {
    return PaperExamChapterConfig(
      id: (json['id'] as num?)?.toInt(),
      chapterId: (json['chapterId'] as num).toInt(),
      chapterName: json['chapterName'] as String? ?? '',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
    );
  }
}

@immutable
class PaperExam {
  const PaperExam({
    required this.id,
    required this.title,
    required this.subjectId,
    required this.subjectName,
    required this.durationMinutes,
    required this.totalQuestions,
    required this.omrQuestionsPerPage,
    required this.omrChoicesPerQ,
    required this.omrPageCount,
    required this.status,
    this.createdAt = '',
    this.updatedAt = '',
    this.createdById,
    this.createdByName = '',
    this.showAnswers = true,
    this.chapterConfigs = const [],
  });

  final int id;
  final String title;
  final int subjectId;
  final String subjectName;
  final int durationMinutes;
  final int totalQuestions;

  /// Số câu trên mỗi trang phiếu OMR.
  final int omrQuestionsPerPage;

  /// Số lựa chọn tối đa mỗi câu (A..E).
  final int omrChoicesPerQ;

  /// Số trang phiếu cần thiết để chứa hết câu hỏi.
  final int omrPageCount;
  final bool showAnswers;

  /// Hiện backend chỉ hỗ trợ `DRAFT`.
  final String status;
  final int? createdById;
  final String createdByName;
  final String createdAt;
  final String updatedAt;
  final List<PaperExamChapterConfig> chapterConfigs;

  factory PaperExam.fromJson(Map<String, dynamic> json) {
    final raw = json['chapterConfigs'] as List<dynamic>? ?? const [];
    return PaperExam(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      subjectId: (json['subjectId'] as num?)?.toInt() ?? 0,
      subjectName: json['subjectName'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      omrQuestionsPerPage: (json['omrQuestionsPerPage'] as num?)?.toInt() ?? 0,
      omrChoicesPerQ: (json['omrChoicesPerQ'] as num?)?.toInt() ?? 0,
      omrPageCount: (json['omrPageCount'] as num?)?.toInt() ?? 1,
      showAnswers: json['showAnswers'] as bool? ?? true,
      status: json['status'] as String? ?? 'DRAFT',
      createdById: (json['createdById'] as num?)?.toInt(),
      createdByName: json['createdByName'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      chapterConfigs: raw
          .map(
            (e) =>
                PaperExamChapterConfig.fromJson(e as Map<String, dynamic>),
          )
          .toList(growable: false),
    );
  }
}

/// Payload tạo đề giấy.
@immutable
class PaperExamRequest {
  const PaperExamRequest({
    required this.title,
    required this.subjectId,
    required this.durationMinutes,
    required this.totalQuestions,
    required this.chapterConfigs,
  });

  final String title;
  final int subjectId;
  final int durationMinutes;
  final int totalQuestions;
  final List<PaperExamChapterConfig> chapterConfigs;

  Map<String, dynamic> toJson() => {
    'title': title,
    'subjectId': subjectId,
    'durationMinutes': durationMinutes,
    'totalQuestions': totalQuestions,
    'chapterConfigs': chapterConfigs
        .map((c) => {'chapterId': c.chapterId, 'questionCount': c.questionCount})
        .toList(),
  };
}

/// Trạng thái tổng thể của một lần quét phiếu.
enum ScanStatus {
  success('SUCCESS'),
  failedToRead('FAILED_TO_READ'),
  needsReview('NEEDS_REVIEW'),
  timeout('TIMEOUT'),
  invalidImage('INVALID_IMAGE'),
  serviceUnavailable('SERVICE_UNAVAILABLE');

  const ScanStatus(this.wire);

  final String wire;

  static ScanStatus fromWire(String? value) {
    for (final status in ScanStatus.values) {
      if (status.wire == value) return status;
    }
    return ScanStatus.failedToRead;
  }

  String get label => switch (this) {
    ScanStatus.success => 'Thành công',
    ScanStatus.failedToRead => 'Không đọc được phiếu',
    ScanStatus.needsReview => 'Cần kiểm tra',
    ScanStatus.timeout => 'Quá thời gian',
    ScanStatus.invalidImage => 'Ảnh không hợp lệ',
    ScanStatus.serviceUnavailable => 'Dịch vụ không sẵn sàng',
  };
}

/// Trạng thái chấm từng câu trong kết quả scan.
enum QuestionScanStatus {
  correct('CORRECT'),
  wrong('WRONG'),
  empty('EMPTY'),
  multiMarked('MULTI_MARKED'),
  needsReview('NEEDS_REVIEW'),
  ignored('IGNORED');

  const QuestionScanStatus(this.wire);

  final String wire;

  static QuestionScanStatus fromWire(String? value) {
    for (final status in QuestionScanStatus.values) {
      if (status.wire == value) return status;
    }
    return QuestionScanStatus.needsReview;
  }

  String get label => switch (this) {
    QuestionScanStatus.correct => 'Đúng',
    QuestionScanStatus.wrong => 'Sai',
    QuestionScanStatus.empty => 'Bỏ trống',
    QuestionScanStatus.multiMarked => 'Tô nhiều ô',
    QuestionScanStatus.needsReview => 'Cần kiểm tra',
    QuestionScanStatus.ignored => 'Bỏ qua',
  };
}

@immutable
class QuestionScanResult {
  const QuestionScanResult({
    required this.questionIndex,
    required this.status,
    required this.isEmpty,
    required this.markedCount,
    required this.confidence,
    this.selectedOptions = const [],
    this.correctOptions = const [],
    this.note,
  });

  /// Số câu **toàn cục** (1-based) trong đề, đã offset theo trang.
  final int questionIndex;
  final QuestionScanStatus status;
  final bool isEmpty;
  final int markedCount;
  final double confidence;
  final List<String> selectedOptions;
  final List<String> correctOptions;
  final String? note;

  factory QuestionScanResult.fromJson(Map<String, dynamic> json) {
    List<String> read(String key) {
      final raw = json[key] as List<dynamic>? ?? const [];
      return raw.map((e) => e.toString()).toList(growable: false);
    }

    return QuestionScanResult(
      questionIndex: (json['questionIndex'] as num).toInt(),
      status: QuestionScanStatus.fromWire(json['status'] as String?),
      isEmpty: json['isEmpty'] as bool? ?? false,
      markedCount: (json['markedCount'] as num?)?.toInt() ?? 0,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      selectedOptions: read('selectedOptions'),
      correctOptions: read('correctOptions'),
      note: json['note'] as String?,
    );
  }
}

@immutable
class ScanResult {
  const ScanResult({
    required this.id,
    required this.status,
    required this.paperExamId,
    required this.actualQuestionCount,
    required this.totalQuestions,
    required this.score,
    required this.totalCorrect,
    required this.totalWrong,
    required this.totalEmpty,
    required this.totalNeedsReview,
    required this.totalMultiMarked,
    required this.createdAt,
    required this.updatedAt,
    this.studentId,
    this.imagePath,
    this.questionResults = const [],
    this.errors = const [],
  });

  final int id;
  final ScanStatus status;
  final int paperExamId;
  final String? studentId;
  final int actualQuestionCount;
  final int totalQuestions;
  final int score;
  final int totalCorrect;
  final int totalWrong;
  final int totalEmpty;
  final int totalNeedsReview;
  final int totalMultiMarked;
  final String? imagePath;
  final String createdAt;
  final String updatedAt;
  final List<QuestionScanResult> questionResults;
  final List<String> errors;

  factory ScanResult.fromJson(Map<String, dynamic> json) {
    final raw = json['questionResults'] as List<dynamic>? ?? const [];
    final rawErrors = json['errors'] as List<dynamic>? ?? const [];

    return ScanResult(
      id: (json['id'] as num).toInt(),
      status: ScanStatus.fromWire(json['status'] as String?),
      paperExamId: (json['paperExamId'] as num?)?.toInt() ?? 0,
      studentId: json['studentId'] as String?,
      actualQuestionCount: (json['actualQuestionCount'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      score: (json['score'] as num?)?.toInt() ?? 0,
      totalCorrect: (json['totalCorrect'] as num?)?.toInt() ?? 0,
      totalWrong: (json['totalWrong'] as num?)?.toInt() ?? 0,
      totalEmpty: (json['totalEmpty'] as num?)?.toInt() ?? 0,
      totalNeedsReview: (json['totalNeedsReview'] as num?)?.toInt() ?? 0,
      totalMultiMarked: (json['totalMultiMarked'] as num?)?.toInt() ?? 0,
      imagePath: json['imagePath'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      questionResults: raw
          .map(
            (e) => QuestionScanResult.fromJson(e as Map<String, dynamic>),
          )
          .toList(growable: false),
      errors: rawErrors.map((e) => e.toString()).toList(growable: false),
    );
  }
}
