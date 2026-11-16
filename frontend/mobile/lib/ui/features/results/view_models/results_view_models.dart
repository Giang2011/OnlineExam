import 'package:flutter/foundation.dart';

import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/session_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/exam.dart';
import '../../../../domain/models/exam_result.dart';

/// ViewModel cho lịch sử điểm của học sinh.
class MyResultsViewModel extends ChangeNotifier {
  MyResultsViewModel(this._resultRepository);

  final ResultRepository _resultRepository;

  List<ExamResult> _results = const [];
  bool _isLoading = true;
  String? _errorMessage;

  List<ExamResult> get results => _results;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Điểm trung bình của các lượt thi.
  double get averageScore {
    if (_results.isEmpty) return 0;
    final sum = _results.fold<double>(0, (acc, r) => acc + r.score);
    return sum / _results.length;
  }

  /// Điểm cao nhất.
  double get bestScore {
    if (_results.isEmpty) return 0;
    return _results.map((r) => r.score).reduce((a, b) => a > b ? a : b);
  }

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _results = await _resultRepository.myResults();
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được lịch sử điểm.';
      _isLoading = false;
      notifyListeners();
    }
  }
}

/// ViewModel cho bảng điểm kỳ thi (giáo viên / admin).
class ExamResultsViewModel extends ChangeNotifier {
  ExamResultsViewModel(this._resultRepository, this.examId);

  final ResultRepository _resultRepository;
  final int examId;

  ExamResultsReport? _report;
  bool _isLoading = true;
  String? _errorMessage;

  ExamResultsReport? get report => _report;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _report = await _resultRepository.byExam(examId);
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được bảng điểm.';
      _isLoading = false;
      notifyListeners();
    }
  }
}

/// ViewModel cho màn chọn kỳ thi để xem bảng điểm.
class ResultsExamPickerViewModel extends ChangeNotifier {
  ResultsExamPickerViewModel(this._examRepository);

  final ExamRepository _examRepository;

  List<Exam> _exams = const [];
  bool _isLoading = true;
  String? _errorMessage;

  List<Exam> get exams => _exams;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _exams = await _examRepository.list();
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được danh sách kỳ thi.';
      _isLoading = false;
      notifyListeners();
    }
  }
}
