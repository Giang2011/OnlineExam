import 'package:flutter/foundation.dart';

import '../../../../data/repositories/question_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/question.dart';

/// ViewModel cho danh sách môn học.
class SubjectListViewModel extends ChangeNotifier {
  SubjectListViewModel(this._repository);

  final SubjectRepository _repository;

  List<Subject> _subjects = const [];
  bool _isLoading = true;
  String? _errorMessage;

  List<Subject> get subjects => _subjects;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _subjects = await _repository.list();
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được danh sách môn học.';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> create(String name) async {
    await _repository.create(name);
    await load();
  }

  Future<void> update(int id, String name) async {
    await _repository.update(id, name);
    await load();
  }

  Future<void> delete(int id) async {
    await _repository.delete(id);
    await load();
  }
}

/// ViewModel cho chi tiết môn học — danh sách chương.
class SubjectDetailViewModel extends ChangeNotifier {
  SubjectDetailViewModel(this._repository, this.subjectId);

  final SubjectRepository _repository;
  final int subjectId;

  Subject? _subject;
  bool _isLoading = true;
  String? _errorMessage;

  Subject? get subject => _subject;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _subject = await _repository.getById(subjectId);
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được môn học.';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createChapter(String name) async {
    await _repository.createChapter(subjectId, name);
    await load();
  }

  Future<void> updateChapter(int chapterId, String name) async {
    await _repository.updateChapter(subjectId, chapterId, name);
    await load();
  }

  Future<void> deleteChapter(int chapterId) async {
    await _repository.deleteChapter(subjectId, chapterId);
    await load();
  }
}
