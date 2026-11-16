import '../../domain/models/app_user.dart';
import '../../domain/models/question.dart';
import '../services/api_client.dart';

/// Repository cho quản lý tài khoản.
class UserRepository {
  UserRepository(this._api);

  final ApiClient _api;

  /// `GET /users` — backend trả mảng phẳng.
  Future<List<AppUser>> list() async {
    final data = await _api.get<List<dynamic>>('/users');
    return data
        .map((e) => AppUser.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<AppUser> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/users/$id');
    return AppUser.fromJson(data);
  }

  /// `POST /users/students` — username/password chỉ trả về **1 lần duy nhất**.
  Future<CreatedCredentials> createStudent({
    required String studentId,
    required String name,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/users/students',
      body: {'studentId': studentId, 'name': name},
    );
    return CreatedCredentials.fromJson(data);
  }

  /// `POST /users/teachers` — chỉ ADMIN.
  Future<AppUser> createTeacher({
    required String username,
    required String password,
    required String name,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/users/teachers',
      body: {'username': username, 'password': password, 'name': name},
    );
    return AppUser.fromJson(data);
  }

  /// `PUT /users/{id}` — partial update, chỉ sửa được user có role `TEACHER`.
  Future<AppUser> update({
    required int id,
    String? username,
    String? password,
    String? name,
  }) async {
    final body = <String, dynamic>{
      if (username != null && username.isNotEmpty) 'username': username,
      if (password != null && password.isNotEmpty) 'password': password,
      if (name != null && name.isNotEmpty) 'name': name,
    };
    final data = await _api.put<Map<String, dynamic>>('/users/$id', body: body);
    return AppUser.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete<void>('/users/$id');
  }
}
