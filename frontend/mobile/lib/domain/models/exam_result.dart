import 'package:meta/meta.dart';

/// Kết quả thi — shape dùng chung cho mọi endpoint của module Results.
@immutable
class ExamResult {
  const ExamResult({
    required this.id,
    required this.examSessionId,
    required this.examTitle,
    required this.studentName,
    required this.score,
    required this.totalCorrect,
    required this.totalQuestions,
    required this.submittedAt,
    this.rank,
  });

  final int id;

  /// Hạng — chỉ có giá trị trong `GET /results/exam/{examId}`, các endpoint khác là `null`.
  final int? rank;
  final int examSessionId;
  final String examTitle;
  final String studentName;

  /// Điểm thang 0–10.
  final double score;
  final int totalCorrect;
  final int totalQuestions;
  final String submittedAt;

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    return ExamResult(
      id: (json['id'] as num).toInt(),
      rank: (json['rank'] as num?)?.toInt(),
      examSessionId: (json['examSessionId'] as num?)?.toInt() ?? 0,
      examTitle: json['examTitle'] as String? ?? '',
      studentName: json['studentName'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0,
      totalCorrect: (json['totalCorrect'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
      submittedAt: json['submittedAt'] as String? ?? '',
    );
  }
}

/// Thống kê điểm kỳ thi.
@immutable
class ExamStatistics {
  const ExamStatistics({
    required this.average,
    required this.highest,
    required this.lowest,
    required this.totalSubmitted,
    required this.distribution,
  });

  final double average;
  final double highest;
  final double lowest;
  final int totalSubmitted;

  /// Phân bố theo 5 khoảng: `[0,2) [2,4) [4,6) [6,8) [8,10]`.
  final List<int> distribution;

  factory ExamStatistics.fromJson(Map<String, dynamic> json) {
    final dist = json['distribution'] as Map<String, dynamic>? ?? const {};
    int read(String key) => (dist[key] as num?)?.toInt() ?? 0;

    return ExamStatistics(
      average: (json['average'] as num?)?.toDouble() ?? 0,
      highest: (json['highest'] as num?)?.toDouble() ?? 0,
      lowest: (json['lowest'] as num?)?.toDouble() ?? 0,
      totalSubmitted: (json['totalSubmitted'] as num?)?.toInt() ?? 0,
      distribution: <int>[
        read('from0To2'),
        read('from2To4'),
        read('from4To6'),
        read('from6To8'),
        read('from8To10'),
      ],
    );
  }
}

/// Bảng điểm kỳ thi — `GET /results/exam/{examId}` trả **object**, không phải mảng phẳng.
@immutable
class ExamResultsReport {
  const ExamResultsReport({
    required this.examId,
    required this.examTitle,
    required this.statistics,
    required this.results,
  });

  final int examId;
  final String examTitle;
  final ExamStatistics statistics;

  /// Đã sort sẵn theo `score` giảm dần, `rank` gán theo thứ tự đó.
  final List<ExamResult> results;

  factory ExamResultsReport.fromJson(Map<String, dynamic> json) {
    final raw = json['results'] as List<dynamic>? ?? const [];
    return ExamResultsReport(
      examId: (json['examId'] as num?)?.toInt() ?? 0,
      examTitle: json['examTitle'] as String? ?? '',
      statistics: ExamStatistics.fromJson(
        json['statistics'] as Map<String, dynamic>? ?? const {},
      ),
      results: raw
          .map((e) => ExamResult.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
