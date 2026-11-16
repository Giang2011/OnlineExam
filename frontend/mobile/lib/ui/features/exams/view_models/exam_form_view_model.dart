import 'package:flutter/foundation.dart';

import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/question_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/exam.dart';
import '../../../../domain/models/question.dart';
import '../../../../domain/use_cases/chapter_config_validator.dart';

/// ViewModel cho form tạo / sửa kỳ thi.
///
/// Validate **trước khi submit**: tổng số câu phải khớp, không vượt quá số câu
/// có sẵn trong chương, và thời gian bắt đầu phải trước thời gian kết thúc.
class ExamFormViewModel extends ChangeNotifier {
  ExamFormViewModel({
    required ExamRepository examRepository,
    required SubjectRepository subjectRepository,
    required ChapterConfigValidator validator,
    this.examId,
  }) : _examRepository = examRepository,
       _subjectRepository = subjectRepository,
       _validator = validator;

  final ExamRepository _examRepository;
  final SubjectRepository _subjectRepository;
  final ChapterConfigValidator _validator;
  final int? examId;

  bool get isEditing => examId != null;

  List<Subject> _subjects = const [];
  Subject? _selectedSubject;
  Exam? _existingExam;

  final Map<int, int> _chapterCounts = {};
  final Map<int, String> _chapterNames = {};
  final Map<int, int> _chapterQuestionCounts = {};

  String _title = '';
  int _duration = 60;
  int _totalQuestions = 10;
  int _totalVariants = 4;
  int _maxAttempts = 1;
  DateTime? _startTime;
  DateTime? _endTime;

  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<Subject> get subjects => _subjects;
  Subject? get selectedSubject => _selectedSubject;
  Map<int, int> get chapterCounts => _chapterCounts;
  Map<int, String> get chapterNames => _chapterNames;
  String get title => _title;
  int get duration => _duration;
  int get totalQuestions => _totalQuestions;
  int get totalVariants => _totalVariants;
  int get maxAttempts => _maxAttempts;
  DateTime? get startTime => _startTime;
  DateTime? get endTime => _endTime;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  /// Tổng số câu đang cấu hình.
  int get configuredQuestionTotal =>
      _chapterQuestionCounts.values.fold<int>(0, (a, b) => a + b);

  /// Có hợp lệ để submit không.
  bool get canSubmit =>
      _title.trim().isNotEmpty &&
      _selectedSubject != null &&
      _chapterQuestionCounts.isNotEmpty &&
      _errorMessage == null;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      _subjects = await _subjectRepository.list();

      if (examId != null) {
        _existingExam = await _examRepository.getById(examId!);
        final exam = _existingExam!;
        _title = exam.title;
        _duration = exam.duration;
        _totalQuestions = exam.totalQuestions;
        _totalVariants = exam.totalVariants;
        _maxAttempts = exam.maxAttempts;
        _startTime = DateTime.tryParse(exam.startTime);
        _endTime = DateTime.tryParse(exam.endTime);

        final subject = _subjects.where((s) => s.id == exam.subjectId);
        if (subject.isNotEmpty) {
          await selectSubject(subject.first.id);
        }
      }
    } on ApiError catch (e) {
      _errorMessage = e.message;
    } catch (_) {
      _errorMessage = 'Không tải được dữ liệu kỳ thi.';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Chọn môn học — nạp danh sách chương kèm số câu có sẵn.
  Future<void> selectSubject(int subjectId) async {
    try {
      final subject = await _subjectRepository.getById(subjectId);
      _selectedSubject = subject;
      _chapterCounts
        ..clear()
        ..addEntries(
          subject.chapters.map((c) => MapEntry(c.id, c.questionCount)),
        );
      _chapterNames
        ..clear()
        ..addEntries(subject.chapters.map((c) => MapEntry(c.id, c.name)));
      _errorMessage = null;
    } on ApiError catch (e) {
      _errorMessage = e.message;
    }
    notifyListeners();
  }

  void setTitle(String value) {
    _title = value;
    notifyListeners();
  }

  void setDuration(int value) {
    _duration = value;
    notifyListeners();
  }

  void setTotalQuestions(int value) {
    _totalQuestions = value;
    _validate();
    notifyListeners();
  }

  void setTotalVariants(int value) {
    _totalVariants = value < 1 ? 1 : value;
    notifyListeners();
  }

  void setMaxAttempts(int value) {
    _maxAttempts = value < 1 ? 1 : value;
    notifyListeners();
  }

  void setStartTime(DateTime? value) {
    _startTime = value;
    _validate();
    notifyListeners();
  }

  void setEndTime(DateTime? value) {
    _endTime = value;
    _validate();
    notifyListeners();
  }

  /// Đặt số câu cho một chương. Giá trị âm sẽ bị chặn.
  void setChapterQuestionCount(int chapterId, int count) {
    final value = count < 0 ? 0 : count;
    if (value == 0) {
      _chapterQuestionCounts.remove(chapterId);
    } else {
      _chapterQuestionCounts[chapterId] = value;
    }
    _validate();
    notifyListeners();
  }

  int getChapterQuestionCount(int chapterId) =>
      _chapterQuestionCounts[chapterId] ?? 0;

  void _validate() {
    _errorMessage = _validator.validateAll(
      configs: _buildConfigs(),
      totalQuestions: _totalQuestions,
      availableByChapterId: _chapterCounts,
      chapterNameById: _chapterNames,
      startTime: _startTime,
      endTime: _endTime,
    );
  }

  List<ChapterConfig> _buildConfigs() {
    return _chapterQuestionCounts.entries
        .map(
          (e) => ChapterConfig(chapterId: e.key, questionCount: e.value),
        )
        .toList(growable: false);
  }

  /// Tạo hoặc cập nhật kỳ thi. Trả về `true` nếu thành công.
  Future<bool> submit() async {
    _validate();
    if (_errorMessage != null) {
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    notifyListeners();

    final request = ExamRequest(
      title: _title.trim(),
      subjectId: _selectedSubject!.id,
      duration: _duration,
      totalQuestions: _totalQuestions,
      totalVariants: _totalVariants,
      maxAttempts: _maxAttempts,
      chapterConfigs: _buildConfigs(),
      startTime: _startTime!.toUtc().toIso8601String(),
      endTime: _endTime!.toUtc().toIso8601String(),
    );

    try {
      if (examId != null) {
        await _examRepository.update(examId!, request);
      } else {
        await _examRepository.create(request);
      }
      _isSubmitting = false;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isSubmitting = false;
      notifyListeners();
      return false;
    } catch (_) {
      _errorMessage = 'Không lưu được kỳ thi. Kiểm tra lại mạng.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }
}
