import 'package:flutter/foundation.dart';

import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/exam.dart';

/// ViewModel cho danh sách kỳ thi (giáo viên / admin).
class ExamListViewModel extends ChangeNotifier {
  ExamListViewModel(this._repository);

  final ExamRepository _repository;

  List<Exam> _exams = const [];
  bool _isLoading = true;
  String? _errorMessage;
  ExamStatus? _statusFilter;

  List<Exam> get exams => _exams;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  ExamStatus? get statusFilter => _statusFilter;

  /// Danh sách đã lọc theo trạng thái.
  List<Exam> get filteredExams {
    final filter = _statusFilter;
    if (filter == null) return _exams;
    return _exams.where((e) => e.status == filter).toList(growable: false);
  }

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _exams = await _repository.list();
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

  void setStatusFilter(ExamStatus? filter) {
    if (_statusFilter == filter) return;
    _statusFilter = filter;
    notifyListeners();
  }

  Future<void> delete(int id) async {
    await _repository.delete(id);
    await load();
  }
}
