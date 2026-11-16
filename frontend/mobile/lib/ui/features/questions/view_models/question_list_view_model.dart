import 'package:flutter/foundation.dart';

import '../../../../data/repositories/question_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/question.dart';

/// ViewModel cho danh sách câu hỏi (giáo viên / admin).
class QuestionListViewModel extends ChangeNotifier {
  QuestionListViewModel(this._repository);

  final QuestionRepository _repository;

  PageResult<Question> _page = const PageResult(
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  );
  List<Subject> _subjects = const [];
  bool _isLoading = true;
  String? _errorMessage;

  int _pageIndex = 0;
  int? _subjectId;
  int? _chapterId;
  String _keyword = '';

  PageResult<Question> get page => _page;
  List<Subject> get subjects => _subjects;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get pageIndex => _pageIndex;
  int get totalPages => _page.totalPages;
  int? get subjectId => _subjectId;
  int? get chapterId => _chapterId;
  String get keyword => _keyword;

  /// Danh sách chương của môn đang chọn.
  List<Chapter> get chapters {
    if (_subjectId == null) return const [];
    final subject = _subjects.where((s) => s.id == _subjectId);
    if (subject.isEmpty) return const [];
    return subject.first.chapters;
  }

  Future<void> init() async {
    try {
      _subjects = await _repository.listSubjects();
    } catch (_) {
      _subjects = const [];
    }
    await load();
  }

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _page = await _repository.list(
        subjectId: _subjectId,
        chapterId: _chapterId,
        keyword: _keyword,
        page: _pageIndex,
        size: 20,
      );
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được danh sách câu hỏi.';
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSubject(int? subjectId) {
    _subjectId = subjectId;
    _chapterId = null;
    _pageIndex = 0;
    load();
  }

  void setChapter(int? chapterId) {
    _chapterId = chapterId;
    _pageIndex = 0;
    load();
  }

  void setKeyword(String keyword) {
    _keyword = keyword;
    _pageIndex = 0;
    load();
  }

  void goToPage(int index) {
    if (index < 0 || index >= _page.totalPages) return;
    _pageIndex = index;
    load();
  }

  Future<void> delete(int id) async {
    await _repository.delete(id);
    await load();
  }
}
