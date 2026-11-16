import '../../domain/models/app_user.dart';
import '../../domain/models/exam.dart';
import '../services/api_client.dart';

/// Repository cho kỳ thi và thí sinh.
class ExamRepository {
  ExamRepository(this._api);

  final ApiClient _api;

  /// `GET /exams` — backend tự lọc theo role (STUDENT chỉ thấy kỳ thi được phân công).
  Future<List<Exam>> list() async {
    final data = await _api.get<List<dynamic>>('/exams');
    return data
        .map((e) => Exam.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /exams/{id}` — STUDENT gọi kỳ thi không được phân công sẽ nhận 403.
  Future<Exam> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/exams/$id');
    return Exam.fromJson(data);
  }

  /// `POST /exams`.
  Future<Exam> create(ExamRequest request) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/exams',
      body: request.toJson(),
    );
    return Exam.fromJson(data);
  }

  /// `PUT /exams/{id}` — chỉ kỳ thi `UPCOMING`.
  Future<Exam> update(int id, ExamRequest request) async {
    final data = await _api.put<Map<String, dynamic>>(
      '/exams/$id',
      body: request.toJson(),
    );
    return Exam.fromJson(data);
  }

  /// `DELETE /exams/{id}` — chỉ kỳ thi `UPCOMING`.
  Future<void> delete(int id) async {
    await _api.delete<void>('/exams/$id');
  }

  /// `GET /exams/{examId}/participants` — trả `UserResponseDTO`, **không** có field `userId`.
  ///
  /// Dùng `id` làm `userId` khi gọi API xoá thí sinh.
  Future<List<AppUser>> listParticipants(int examId) async {
    final data = await _api.get<List<dynamic>>('/exams/$examId/participants');
    return data
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `POST /exams/{examId}/participants` — response không có body.
  Future<void> addParticipant(int examId, int userId) async {
    await _api.post<void>(
      '/exams/$examId/participants',
      body: {'userId': userId},
    );
  }

  /// `DELETE /exams/{examId}/participants/{userId}`.
  Future<void> removeParticipant(int examId, int userId) async {
    await _api.delete<void>('/exams/$examId/participants/$userId');
  }
}
