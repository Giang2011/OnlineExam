import 'dart:convert';

import 'package:dio/dio.dart';

import '../../domain/models/paper_exam.dart';
import '../services/api_client.dart';

/// Repository cho đề giấy và quét phiếu OMR.
class PaperExamRepository {
  PaperExamRepository(this._api);

  final ApiClient _api;

  /// `GET /paper-exams`.
  Future<List<PaperExam>> list() async {
    final data = await _api.get<List<dynamic>>('/paper-exams');
    return data
        .map((e) => PaperExam.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /paper-exams/{id}`.
  Future<PaperExam> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/paper-exams/$id');
    return PaperExam.fromJson(data);
  }

  /// `POST /paper-exams` — backend trả **200** (không phải 201).
  Future<PaperExam> create(PaperExamRequest request) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/paper-exams',
      body: request.toJson(),
    );
    return PaperExam.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete<void>('/paper-exams/$id');
  }

  /// `GET /paper-exams/{id}/pdf` — tải PDF đề giấy (không chứa `isCorrect`).
  Future<List<int>> downloadPdf(int id) =>
      _api.downloadBytes('/paper-exams/$id/pdf');

  /// `GET /paper-exams/{id}/omr-sheet` — tải phiếu trả lời OMR.
  Future<List<int>> downloadOmrSheet(int id, {String? studentId}) =>
      _api.downloadBytes(
        '/paper-exams/$id/omr-sheet',
        query: studentId == null ? null : {'studentId': studentId},
      );

  /// `GET /paper-exams/{id}/answers` — xem đáp án của đề giấy.
  Future<PaperExamAnswerSheet> answers(int paperExamId) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/paper-exams/$paperExamId/answers',
    );
    return PaperExamAnswerSheet.fromJson(data);
  }

  /// `POST /paper-exams/{id}/scan` — multipart.
  ///
  /// Part `images` (số nhiều) — mỗi ảnh là một trang phiếu.
  Future<ScanResult> scan({
    required int paperExamId,
    required List<String> imagePaths,
    int? actualQuestionCount,
    String scanMode = 'AUTO',
    bool debug = false,
  }) async {
    // Mỗi ảnh là một part `images` riêng. Phải gom vào **một list** dưới
    // cùng key — nếu lặp key trong map thì part trước bị ghi đè và chỉ
    // trang cuối cùng được gửi đi.
    final form = FormData.fromMap({
      'images': [
        for (final path in imagePaths)
          await MultipartFile.fromFile(path),
      ],
      if (actualQuestionCount != null)
        'actualQuestionCount': actualQuestionCount.toString(),
      'scanMode': scanMode,
      'debug': debug.toString(),
    });

    final data = await _api.postMultipart<Map<String, dynamic>>(
      '/paper-exams/$paperExamId/scan',
      form,
    );
    return ScanResult.fromJson(data);
  }

  /// `GET /paper-exams/{id}/scan-results`.
  Future<List<ScanResult>> scanResults(int paperExamId) async {
    final data = await _api.get<List<dynamic>>(
      '/paper-exams/$paperExamId/scan-results',
    );
    return data
        .map((e) => ScanResult.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /paper-exams/scan-results/{scanResultId}`.
  Future<ScanResult> scanResultById(int scanResultId) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/paper-exams/scan-results/$scanResultId',
    );
    return ScanResult.fromJson(data);
  }
}

/// Payload xem đáp án của đề giấy (`GET /paper-exams/{id}/answers`).
///
/// Dùng **`answerId`** làm định danh ổn định giữa các lần đọc đề;
/// `id` là id của *snapshot* đáp án trong đề giấy.
class PaperExamAnswerSheet {
  const PaperExamAnswerSheet({
    required this.paperExamId,
    required this.title,
    required this.showAnswers,
    required this.questions,
  });

  final int paperExamId;
  final String title;
  final bool showAnswers;
  final List<PaperExamAnswerQuestion> questions;

  factory PaperExamAnswerSheet.fromJson(Map<String, dynamic> json) {
    final raw = json['questions'] as List<dynamic>? ?? const [];
    return PaperExamAnswerSheet(
      paperExamId: (json['paperExamId'] as num?)?.toInt() ?? 0,
      title: json['title'] as String? ?? '',
      showAnswers: json['showAnswers'] as bool? ?? true,
      questions: raw
          .map(
            (e) => PaperExamAnswerQuestion.fromJson(e as Map<String, dynamic>),
          )
          .toList(growable: false),
    );
  }
}

class PaperExamAnswerQuestion {
  const PaperExamAnswerQuestion({
    required this.id,
    required this.questionId,
    required this.chapterName,
    required this.orderIndex,
    required this.content,
    required this.answers,
    this.imageUrl,
  });

  final int id;
  final int questionId;
  final String chapterName;
  final int orderIndex;
  final String content;
  final String? imageUrl;
  final List<PaperExamAnswer> answers;

  factory PaperExamAnswerQuestion.fromJson(Map<String, dynamic> json) {
    final raw = json['answers'] as List<dynamic>? ?? const [];
    return PaperExamAnswerQuestion(
      id: (json['id'] as num?)?.toInt() ?? 0,
      questionId: (json['questionId'] as num?)?.toInt() ?? 0,
      chapterName: json['chapterName'] as String? ?? '',
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      answers: raw
          .map((e) => PaperExamAnswer.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class PaperExamAnswer {
  const PaperExamAnswer({
    required this.id,
    required this.answerId,
    required this.orderIndex,
    required this.content,
    required this.isCorrect,
    this.imageUrl,
  });

  /// Id snapshot trong đề giấy.
  final int id;

  /// Id đáp án gốc trong ngân hàng — **định danh ổn định**.
  final int answerId;
  final int orderIndex;
  final String content;
  final bool isCorrect;
  final String? imageUrl;

  factory PaperExamAnswer.fromJson(Map<String, dynamic> json) {
    return PaperExamAnswer(
      id: (json['id'] as num?)?.toInt() ?? 0,
      answerId: (json['answerId'] as num?)?.toInt() ?? 0,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      content: json['content'] as String? ?? '',
      isCorrect: json['isCorrect'] as bool? ?? false,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

/// Extension để parse JSON string thành map — dùng khi cần decode thủ công.
Map<String, dynamic> decodeJsonObject(String raw) =>
    jsonDecode(raw) as Map<String, dynamic>;
