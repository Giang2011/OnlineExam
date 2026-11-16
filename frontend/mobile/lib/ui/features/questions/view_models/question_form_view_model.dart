import 'package:flutter/foundation.dart';

import '../../../../data/repositories/question_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/question.dart';

/// Một đáp án trong form soạn câu hỏi.
class AnswerDraft {
  AnswerDraft({
    required this.content,
    required this.isCorrect,
    this.imagePath,
    this.imageRemoved = false,
    this.existingImageUrl,
  });

  String content;
  bool isCorrect;

  /// Ảnh đã chọn mới (đường dẫn file cục bộ) — chưa upload.
  String? imagePath;

  /// Ảnh đang có trên server.
  String? existingImageUrl;

  /// Cờ yêu cầu xoá ảnh cũ.
  bool imageRemoved;

  /// Ảnh hiển thị trước mắt.
  String? get previewUrl => imagePath ?? existingImageUrl;
}

/// ViewModel cho form soạn câu hỏi.
class QuestionFormViewModel extends ChangeNotifier {
  QuestionFormViewModel({
    required QuestionRepository repository,
    this.questionId,
  }) : _repository = repository;

  final QuestionRepository _repository;
  final int? questionId;

  bool get isEditing => questionId != null;

  String _content = '';
  int? _subjectId;
  int? _chapterId;
  final List<AnswerDraft> _answers = [];
  String? _questionImagePath;
  String? _existingQuestionImageUrl;
  bool _questionImageRemoved = false;

  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  List<Subject> _subjects = const [];

  String get content => _content;
  int? get subjectId => _subjectId;
  int? get chapterId => _chapterId;
  List<AnswerDraft> get answers => _answers;
  List<Subject> get subjects => _subjects;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  String? get questionImagePath => _questionImagePath;
  String? get existingQuestionImageUrl => _existingQuestionImageUrl;
  bool get questionImageRemoved => _questionImageRemoved;

  String? get questionImagePreview =>
      _questionImagePath ?? (_questionImageRemoved
          ? null
          : _existingQuestionImageUrl);

  List<Chapter> get chapters {
    if (_subjectId == null) return const [];
    final subject = _subjects.where((s) => s.id == _subjectId);
    if (subject.isEmpty) return const [];
    return subject.first.chapters;
  }

  bool get hasCorrectAnswer => _answers.any((a) => a.isCorrect);

  /// Có thể submit khi: đủ nội dung, đã chọn môn + chương, ít nhất 2 đáp án
  /// và có ít nhất 1 đáp án đúng.
  bool get canSubmit =>
      _content.trim().isNotEmpty &&
      _subjectId != null &&
      _chapterId != null &&
      _answers.length >= 2 &&
      hasCorrectAnswer;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      _subjects = await _repository.listSubjects();

      if (questionId != null) {
        final question = await _repository.getById(questionId!);
        _content = question.content;
        _subjectId = question.subjectId;
        _chapterId = question.chapterId;
        _existingQuestionImageUrl = question.imageUrl;
        _answers
          ..clear()
          ..addAll(
            question.answers.map(
              (a) => AnswerDraft(
                content: a.content,
                isCorrect: a.isCorrect,
                existingImageUrl: a.imageUrl,
              ),
            ),
          );
      } else {
        // Mặc định tạo 4 đáp án trống cho trải nghiệm nhập nhanh.
        for (var i = 0; i < 4; i++) {
          _answers.add(AnswerDraft(content: '', isCorrect: false));
        }
      }
    } on ApiError catch (e) {
      _errorMessage = e.message;
    } catch (_) {
      _errorMessage = 'Không tải được câu hỏi.';
    }

    _isLoading = false;
    notifyListeners();
  }

  void setContent(String value) {
    _content = value;
    notifyListeners();
  }

  void setSubject(int? value) {
    _subjectId = value;
    _chapterId = null;
    notifyListeners();
  }

  void setChapter(int? value) {
    _chapterId = value;
    notifyListeners();
  }

  void setQuestionImage(String? path) {
    _questionImagePath = path;
    if (path != null) _questionImageRemoved = false;
    notifyListeners();
  }

  void removeQuestionImage() {
    _questionImagePath = null;
    _existingQuestionImageUrl = null;
    _questionImageRemoved = true;
    notifyListeners();
  }

  void updateAnswer(int index, {String? content, bool? isCorrect}) {
    if (index < 0 || index >= _answers.length) return;
    final answer = _answers[index];
    if (content != null) answer.content = content;
    if (isCorrect != null) answer.isCorrect = isCorrect;
    notifyListeners();
  }

  void setAnswerImage(int index, String? path) {
    if (index < 0 || index >= _answers.length) return;
    final answer = _answers[index];
    answer.imagePath = path;
    if (path != null) answer.imageRemoved = false;
    notifyListeners();
  }

  void removeAnswerImage(int index) {
    if (index < 0 || index >= _answers.length) return;
    final answer = _answers[index];
    answer.imagePath = null;
    answer.existingImageUrl = null;
    answer.imageRemoved = true;
    notifyListeners();
  }

  void addAnswer() {
    _answers.add(AnswerDraft(content: '', isCorrect: false));
    notifyListeners();
  }

  void removeAnswer(int index) {
    if (index < 0 || index >= _answers.length) return;
    _answers.removeAt(index);
    notifyListeners();
  }

  Future<bool> submit() async {
    if (!canSubmit) {
      _errorMessage = _buildValidationMessage();
      notifyListeners();
      return false;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final answerModels = _answers
          .map(
            (a) => Answer(
              content: a.content,
              isCorrect: a.isCorrect,
              imageRemoved: a.imageRemoved,
            ),
          )
          .toList(growable: false);

      if (questionId != null) {
        await _repository.update(
          id: questionId!,
          content: _content.trim(),
          subjectId: _subjectId!,
          chapterId: _chapterId!,
          answers: answerModels,
          questionImagePath: _questionImagePath,
          answerImagePaths: _answers
              .map((a) => a.imagePath)
              .whereType<String>()
              .toList(growable: false),
          questionImageRemoved: _questionImageRemoved,
        );
      } else {
        await _repository.create(
          content: _content.trim(),
          subjectId: _subjectId!,
          chapterId: _chapterId!,
          answers: answerModels,
          questionImagePath: _questionImagePath,
          answerImagePaths: _answers
              .map((a) => a.imagePath)
              .whereType<String>()
              .toList(growable: false),
        );
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
      _errorMessage = 'Không lưu được câu hỏi. Kiểm tra lại mạng.';
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  String _buildValidationMessage() {
    if (_content.trim().isEmpty) return 'Vui lòng nhập nội dung câu hỏi.';
    if (_subjectId == null) return 'Vui lòng chọn môn học.';
    if (_chapterId == null) return 'Vui lòng chọn chương.';
    if (_answers.length < 2) return 'Câu hỏi cần ít nhất 2 đáp án.';
    if (!hasCorrectAnswer) return 'Cần có ít nhất 1 đáp án đúng.';
    return 'Thông tin chưa hợp lệ.';
  }
}
