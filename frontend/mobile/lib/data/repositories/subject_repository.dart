import '../../domain/models/subject.dart';
import '../services/api_client.dart';

/// Repository đọc môn học và chương.
///
/// Mobile chỉ phục vụ paper exam nên không có màn quản lý môn/chương —
/// repository này chỉ cấp dữ liệu cho form tạo đề giấy.
class SubjectRepository {
  SubjectRepository(this._api);

  final ApiClient _api;

  /// `GET /subjects` — trả mảng phẳng.
  Future<List<Subject>> list() async {
    final data = await _api.get<List<dynamic>>('/subjects');
    return data
        .map((e) => Subject.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /subjects/{id}` — kèm `chapters[].questionCount`.
  Future<Subject> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/subjects/$id');
    return Subject.fromJson(data);
  }
}
