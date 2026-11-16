import '../../domain/models/exam_result.dart';
import '../../domain/models/exam_session.dart';
import '../services/api_client.dart';

/// Repository cho phiên thi — nguồn sự thật về thời gian là server.
class SessionRepository {
  SessionRepository(this._api);

  final ApiClient _api;

  /// `POST /sessions/start/{examId}` — tự resume nếu đang có phiên `DOING`.
  Future<ExamSession> start(int examId) async {
    final data = await _api.post<Map<String, dynamic>>('/sessions/start/$examId');
    return ExamSession.fromJson(data);
  }

  /// `GET /sessions/active` — trả `204` nếu không có phiên đang diễn ra.
  Future<ActiveSession?> active() async {
    final data = await _api.get<Object?>('/sessions/active');
    if (data == null) return null;
    return ActiveSession.fromJson(data as Map<String, dynamic>);
  }

  /// `GET /sessions/{id}`.
  Future<ExamSession> getById(int sessionId) async {
    final data = await _api.get<Map<String, dynamic>>('/sessions/$sessionId');
    return ExamSession.fromJson(data);
  }

  /// `GET /sessions/{id}/questions` — **không** trả `isCorrect`.
  Future<List<SessionQuestion>> questions(int sessionId) async {
    final data = await _api.get<List<dynamic>>('/sessions/$sessionId/questions');
    return data
        .map((e) => SessionQuestion.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /sessions/{id}/answers` — draft đã autosave trên server.
  Future<AnswerDraft> answers(int sessionId) async {
    final data = await _api.get<Map<String, dynamic>>('/sessions/$sessionId/answers');
    return AnswerDraft.fromJson(data);
  }

  /// `PUT /sessions/{id}/answers` — autosave. Trả về draft sau khi lưu.
  Future<AnswerDraft> saveAnswers(
    int sessionId,
    List<SelectedAnswer> answers,
  ) async {
    final data = await _api.put<Map<String, dynamic>>(
      '/sessions/$sessionId/answers',
      body: {'answers': answers.map((a) => a.toJson()).toList()},
    );
    return AnswerDraft.fromJson(data);
  }

  /// `POST /sessions/{id}/submit` — response đã kèm `score` / `totalCorrect` / `totalQuestions`.
  Future<ExamSession> submit(
    int sessionId,
    List<SelectedAnswer> answers,
  ) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/sessions/$sessionId/submit',
      body: {'answers': answers.map((a) => a.toJson()).toList()},
    );
    return ExamSession.fromJson(data);
  }
}

/// Repository cho kết quả thi.
class ResultRepository {
  ResultRepository(this._api);

  final ApiClient _api;

  /// `GET /results/me` — lịch sử thi, đã sort `submittedAt` giảm dần.
  Future<List<ExamResult>> myResults() async {
    final data = await _api.get<List<dynamic>>('/results/me');
    return data
        .map((e) => ExamResult.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /results/session/{sessionId}` — STUDENT chỉ xem được phiên của mình.
  Future<ExamResult> bySession(int sessionId) async {
    final data = await _api.get<Map<String, dynamic>>('/results/session/$sessionId');
    return ExamResult.fromJson(data);
  }

  /// `GET /results/exam/{examId}` — trả **object** `{ statistics, results[] }`.
  Future<ExamResultsReport> byExam(int examId) async {
    final data = await _api.get<Map<String, dynamic>>('/results/exam/$examId');
    return ExamResultsReport.fromJson(data);
  }
}
