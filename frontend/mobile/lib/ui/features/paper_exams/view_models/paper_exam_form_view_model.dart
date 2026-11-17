import 'package:flutter/foundation.dart';

import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/repositories/subject_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/paper_exam.dart';
import '../../../../domain/models/subject.dart';
import '../../../../domain/use_cases/paper_exam_config_validator.dart';

/// ViewModel cho form tạo đề giấy.
class PaperExamFormViewModel extends ChangeNotifier {
  PaperExamFormViewModel({
    required PaperExamRepository paperExamRepository,
    required SubjectRepository subjectRepository,
    required PaperExamConfigValidator validator,
  }) : _paperExamRepository = paperExamRepository,
       _subjectRepository = subjectRepository,
       _validator = validator;

  final PaperExamRepository _paperExamRepository;
  final SubjectRepository _subjectRepository;
  final PaperExamConfigValidator _validator;

  List<Subject> _subjects = const [];
  Subject? _selectedSubject;
  String _title = '';
  int _durationMinutes = 45;
  int _totalQuestions = 10;

  /// Các dòng cấu hình chương — người dùng thêm/bỏ thủ công.
  final List<PaperExamChapterConfig> _chapterConfigs = [];

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<Subject> get subjects => _subjects;
  Subject? get selectedSubject => _selectedSubject;
  String get title => _title;
  int get durationMinutes => _durationMinutes;
  int get totalQuestions => _totalQuestions;
  List<PaperExamChapterConfig> get chapterConfigs =>
      List.unmodifiable(_chapterConfigs);
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  int get configuredTotal =>
      _chapterConfigs.fold<int>(0, (a, c) => a + c.questionCount);

  /// Danh sách chương của môn đang chọn.
  List<Chapter> get availableChapters => _selectedSubject?.chapters ?? const [];

  /// Chương đã dùng trong cấu hình — dùng để chặn chọn trùng.
  Set<int> get usedChapterIds =>
      _chapterConfigs.map((c) => c.chapterId).toSet();

  bool get canSubmit =>
      _title.trim().isNotEmpty &&
      _selectedSubject != null &&
      _chapterConfigs.isNotEmpty &&
      configuredTotal == _totalQuestions &&
      _validator.validateCapacity(
            configs: _chapterConfigs,
            availableByChapterId: _availableByChapterId,
            chapterNameById: _chapterNameById,
          ) ==
          null;

  Map<int, int> get _availableByChapterId => {
    for (final chapter in availableChapters) chapter.id: chapter.questionCount,
  };

  Map<int, String> get _chapterNameById => {
    for (final chapter in availableChapters) chapter.id: chapter.name,
  };

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
      // Đổi môn thì cấu hình chương cũ không còn ý nghĩa.
      _chapterConfigs.clear();
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

  /// Thêm một dòng cấu hình chương với số câu mặc định là 0.
  void addChapterConfig() {
    final chapters = availableChapters.where(
      (c) => !usedChapterIds.contains(c.id),
    );
    if (chapters.isEmpty) return;

    _chapterConfigs.add(
      PaperExamChapterConfig(
        chapterId: chapters.first.id,
        chapterName: chapters.first.name,
        questionCount: 0,
      ),
    );
    notifyListeners();
  }

  /// Bỏ một dòng cấu hình chương.
  void removeChapterConfig(int index) {
    if (index < 0 || index >= _chapterConfigs.length) return;
    _chapterConfigs.removeAt(index);
    notifyListeners();
  }

  /// Đổi chương của một dòng cấu hình — chặn chọn chương đã dùng.
  void setChapterConfigChapter(int index, int chapterId) {
    if (index < 0 || index >= _chapterConfigs.length) return;
    if (usedChapterIds.contains(chapterId)) return;

    final chapter = availableChapters.where((c) => c.id == chapterId);
    _chapterConfigs[index] = PaperExamChapterConfig(
      chapterId: chapterId,
      chapterName: chapter.isEmpty ? 'Chương' : chapter.first.name,
      questionCount: _chapterConfigs[index].questionCount,
    );
    notifyListeners();
  }

  /// Tăng/giảm số câu của một dòng — không vượt quá số câu có sẵn của chương.
  void adjustChapterQuestionCount(int index, int delta) {
    if (index < 0 || index >= _chapterConfigs.length) return;

    final config = _chapterConfigs[index];
    final available = _availableByChapterId[config.chapterId] ?? 0;
    final raw = config.questionCount + delta;
    final next = raw < 0
        ? 0
        : (raw > available ? available : raw);

    _chapterConfigs[index] = PaperExamChapterConfig(
      chapterId: config.chapterId,
      chapterName: config.chapterName,
      questionCount: next,
    );
    notifyListeners();
  }

  /// Số câu có sẵn của chương — dùng để hiển thị và kiểm tra vượt sức chứa.
  int availableCountFor(int chapterId) =>
      _availableByChapterId[chapterId] ?? 0;

  /// Tên chương để hiển thị thông báo lỗi.
  String chapterName(int chapterId) => _chapterNameById[chapterId] ?? 'Chương';

  Future<bool> submit() async {
    final validation = _validator.validateAll(
      configs: _chapterConfigs,
      totalQuestions: _totalQuestions,
      availableByChapterId: _availableByChapterId,
      chapterNameById: _chapterNameById,
    );

    if (!canSubmit) {
      _errorMessage = validation ??
          'Vui lòng điền đầy đủ tên, môn học và cấu hình chương.';
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
        chapterConfigs: _chapterConfigs
            .map(
              (c) => PaperExamChapterConfig(
                chapterId: c.chapterId,
                chapterName: c.chapterName,
                questionCount: c.questionCount,
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
