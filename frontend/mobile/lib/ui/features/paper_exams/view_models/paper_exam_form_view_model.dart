import 'package:flutter/foundation.dart';

import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../../domain/models/question.dart';

/// ViewModel cho form tạo đề giấy.
class PaperExamFormViewModel extends ChangeNotifier {
  PaperExamFormViewModel({
    required PaperExamRepository paperExamRepository,
    required SubjectRepository subjectRepository,
  }) : _paperExamRepository = paperExamRepository,
       _subjectRepository = subjectRepository;

  final PaperExamRepository _paperExamRepository;
  final SubjectRepository _subjectRepository;

  List<Subject> _subjects = const [];
  Subject? _selectedSubject;
  String _title = '';
  int _durationMinutes = 60;
  int _totalQuestions = 20;
  final Map<int, int> _chapterCounts = {};
  final Map<int, String> _chapterNames = {};

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<Subject> get subjects => _subjects;
  Subject? get selectedSubject => _selectedSubject;
  String get title => _title;
  int get durationMinutes => _durationMinutes;
  int get totalQuestions => _totalQuestions;
  Map<int, int> get chapterCounts => _chapterCounts;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  int get configuredTotal =>
      _chapterCounts.values.fold<int>(0, (a, b) => a + b);

  bool get canSubmit =>
      _title.trim().isNotEmpty &&
      _selectedSubject != null &&
      _chapterCounts.isNotEmpty &&
      configuredTotal == _totalQuestions;

  Future<void> init() async {
    try {
      _subjects = await _subjectRepository.list();
    } catch (_) {
      _subjects = const [];
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> selectSubject(int subjectId) async {
    try {
      final subject = await _subjectRepository.getById(subjectId);
      _selectedSubject = subject;
      _chapterCounts
        ..clear()
        ..addEntries(subject.chapters.map((c) => MapEntry(c.id, c.questionCount)));
      _chapterNames
        ..clear()
        ..addEntries(subject.chapters.map((c) => MapEntry(c.id, c.name)));
    } on ApiError catch (e) {
      _errorMessage = e.message;
    }
    notifyListeners();
  }

  void setTitle(String value) {
    _title = value;
    notifyListeners();
  }

  void setDurationMinutes(int value) {
    _durationMinutes = value < 1 ? 1 : value;
    notifyListeners();
  }

  void setTotalQuestions(int value) {
    _totalQuestions = value < 1 ? 1 : value;
    notifyListeners();
  }

  void setChapterQuestionCount(int chapterId, int count) {
    final value = count < 0 ? 0 : count;
    if (value == 0) {
      _chapterCounts.remove(chapterId);
    } else {
      _chapterCounts[chapterId] = value;
    }
    notifyListeners();
  }

  int getChapterQuestionCount(int chapterId) => _chapterCounts[chapterId] ?? 0;

  /// Tên chương để hiển thị thông báo lỗi.
  String chapterName(int chapterId) => _chapterNames[chapterId] ?? 'Chương';

  Future<bool> submit() async {
    if (!canSubmit) {
      _errorMessage = configuredTotal != _totalQuestions
          ? 'Tổng số câu từ các chương ($configuredTotal) phải bằng tổng số câu ($_totalQuestions).'
          : 'Vui lòng điền đầy đủ tên, môn học và cấu hình chương.';
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final request = PaperExamRequest(
        title: _title.trim(),
        subjectId: _selectedSubject!.id,
        durationMinutes: _durationMinutes,
        totalQuestions: _totalQuestions,
        chapterConfigs: _chapterCounts.entries
            .map(
              (e) => PaperExamChapterConfig(
                chapterId: e.key,
                chapterName: chapterName(e.key),
                questionCount: e.value,
              ),
            )
            .toList(growable: false),
      );

      await _paperExamRepository.create(request);
      _isSubmitting = false;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isSubmitting = false;
      notifyListeners();
      return false;
    } catch (_) {
      _errorMessage = 'Không tạo được đề giấy. Kiểm tra lại mạng.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }
}
