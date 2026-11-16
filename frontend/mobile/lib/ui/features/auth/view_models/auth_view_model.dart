import 'package:flutter/foundation.dart';

import '../../../../data/repositories/auth_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/app_user.dart';

/// Trạng thái phiên đăng nhập.
enum AuthStatus {
  /// Đang kiểm tra cookie phiên còn hợp lệ không (khôi phục lúc app mở).
  restoring,

  /// Chưa đăng nhập.
  signedOut,

  /// Đã đăng nhập.
  signedIn,
}

/// ViewModel cho luồng đăng nhập / phiên.
///
/// Theo pattern MVVM của `flutter-apply-architecture-best-practices`:
/// View chỉ đọc state từ đây, mọi lệnh gọi API nằm trong ViewModel.
class AuthViewModel extends ChangeNotifier {
  AuthViewModel(this._repository);

  final AuthRepository _repository;

  AuthStatus _status = AuthStatus.restoring;
  AppUser? _user;
  String? _errorMessage;
  bool _isSubmitting = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isSubmitting => _isSubmitting;
  bool get isSignedIn => _status == AuthStatus.signedIn && _user != null;
  Role? get role => _user?.role;

  /// Khôi phục phiên từ cookie khi app khởi động.
  ///
  /// 401 ở đây là trạng thái bình thường (chưa đăng nhập) nên **không** báo lỗi.
  Future<void> restoreSession() async {
    _status = AuthStatus.restoring;
    notifyListeners();

    try {
      final user = await _repository.restoreSession();
      if (user == null) {
        _user = null;
        _status = AuthStatus.signedOut;
      } else {
        _user = user;
        _status = AuthStatus.signedIn;
      }
    } on ApiError catch (e) {
      _user = null;
      _status = AuthStatus.signedOut;
      // 401 = chưa đăng nhập, không phải lỗi cần báo cho người dùng.
      if (!e.isUnauthorized) _errorMessage = e.message;
    } catch (_) {
      _user = null;
      _status = AuthStatus.signedOut;
      _errorMessage = 'Không kết nối được tới máy chủ. Kiểm tra lại mạng.';
    }

    notifyListeners();
  }

  /// Đăng nhập. Trả về `true` nếu thành công.
  Future<bool> login({
    required String username,
    required String password,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _repository.login(
        username: username,
        password: password,
      );
      _user = user;
      _status = AuthStatus.signedIn;
      _isSubmitting = false;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.isUnauthorized
          ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : e.message;
      _isSubmitting = false;
      notifyListeners();
      return false;
    } catch (_) {
      _errorMessage = 'Không kết nối được tới máy chủ. Kiểm tra lại mạng.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Đăng xuất — xoá cookie phiên phía server và cục bộ.
  Future<void> logout() async {
    await _repository.logout();
    _user = null;
    _status = AuthStatus.signedOut;
    _errorMessage = null;
    notifyListeners();
  }

  /// Xử lý 401 từ bất kỳ request nào — xoá phiên và đưa về màn đăng nhập.
  void handleUnauthorized() {
    if (_status == AuthStatus.signedOut) return;
    _user = null;
    _status = AuthStatus.signedOut;
    _errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    notifyListeners();
  }

  /// Cập nhật hồ sơ (chỉ ADMIN và TEACHER).
  Future<bool> updateProfile({
    String? username,
    String? password,
    String? name,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _repository.updateProfile(
        username: username,
        password: password,
        name: name,
      );
      _user = user;
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

  void clearError() {
    if (_errorMessage == null) return;
    _errorMessage = null;
    notifyListeners();
  }
}
