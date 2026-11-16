import 'package:flutter/foundation.dart';

import '../../../../data/repositories/user_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/app_user.dart';
import '../../../../domain/models/question.dart';

/// ViewModel cho quản lý tài khoản (quản trị viên).
class UserListViewModel extends ChangeNotifier {
  UserListViewModel(this._repository);

  final UserRepository _repository;

  List<AppUser> _users = const [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isSubmitting = false;

  /// Tài khoản vừa tạo — backend chỉ trả mật khẩu **một lần duy nhất**.
  CreatedCredentials? _lastCreated;

  List<AppUser> get users => _users;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isSubmitting => _isSubmitting;
  CreatedCredentials? get lastCreated => _lastCreated;

  List<AppUser> get students =>
      _users.where((u) => u.role == Role.student).toList(growable: false);

  List<AppUser> get teachers =>
      _users.where((u) => u.role == Role.teacher).toList(growable: false);

  List<AppUser> get admins =>
      _users.where((u) => u.role == Role.admin).toList(growable: false);

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _users = await _repository.list();
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được danh sách tài khoản.';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createStudent({
    required String studentId,
    required String name,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _lastCreated = await _repository.createStudent(
        studentId: studentId,
        name: name,
      );
      await load();
      _isSubmitting = false;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> createTeacher({
    required String username,
    required String password,
    required String name,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repository.createTeacher(
        username: username,
        password: password,
        name: name,
      );
      await load();
      _isSubmitting = false;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(int id) async {
    try {
      await _repository.delete(id);
      await load();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    }
  }

  void clearLastCreated() {
    _lastCreated = null;
    notifyListeners();
  }
}
