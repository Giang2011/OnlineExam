import 'package:flutter/foundation.dart';

import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/session_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/exam.dart';
import '../../../../domain/models/exam_session.dart';

/// ViewModel cho danh sách kỳ thi của học sinh.
class StudentExamListViewModel extends ChangeNotifier {
  StudentExamListViewModel(this._examRepository, this._sessionRepository);

  final ExamRepository _examRepository;
  final SessionRepository _sessionRepository;

  List<Exam> _exams = const [];
  ActiveSession? _activeSession;
  bool _isLoading = true;
  String? _errorMessage;

  List<Exam> get exams => _exams;
  ActiveSession? get activeSession => _activeSession;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// `GET /sessions/active` — phiên đang diễn ra (để cho phép nối tiếp).
  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _examRepository.list(),
        _sessionRepository.active(),
      ]);
      _exams = results[0] as List<Exam>;
      _activeSession = results[1] as ActiveSession?;
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không kết nối được tới máy chủ. Kiểm tra lại mạng.';
      _isLoading = false;
      notifyListeners();
    }
  }
}
