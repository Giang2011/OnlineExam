import 'package:flutter/foundation.dart';

import '../../../../data/repositories/exam_repository.dart';
import '../../../../data/repositories/user_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/app_user.dart';
import '../../../../domain/models/exam.dart';

/// ViewModel cho chi tiết kỳ thi — gồm danh sách thí sinh.
class ExamDetailViewModel extends ChangeNotifier {
  ExamDetailViewModel({
    required ExamRepository examRepository,
    required UserRepository userRepository,
    required this.examId,
  }) : _examRepository = examRepository,
       _userRepository = userRepository;
  final ExamRepository _examRepository;
  final UserRepository _userRepository;
  final int examId;

  Exam? _exam;
  List<AppUser> _participants = const [];
  List<AppUser> _candidates = const [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isMutating = false;

  Exam? get exam => _exam;
  List<AppUser> get participants => _participants;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isMutating => _isMutating;

  /// Thí sinh chưa được gán — dùng để chọn khi thêm.
  List<AppUser> get availableStudents {
    final assigned = participants.map((p) => p.id).toSet();
    return _candidates
        .where((c) => c.role == Role.student && !assigned.contains(c.id))
        .toList(growable: false);
  }

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _exam = await _examRepository.getById(examId);
      _participants = await _examRepository.listParticipants(examId);
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được thông tin kỳ thi.';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Nạp danh sách học sinh để chọn khi gán thí sinh.
  Future<void> loadCandidates() async {
    try {
      _candidates = await _userRepository.list();
    } catch (_) {
      _candidates = const [];
    }
    notifyListeners();
  }

  Future<void> addParticipant(int userId) async {
    _isMutating = true;
    notifyListeners();
    try {
      await _examRepository.addParticipant(examId, userId);
      _participants = await _examRepository.listParticipants(examId);
    } finally {
      _isMutating = false;
      notifyListeners();
    }
  }

  Future<void> removeParticipant(int userId) async {
    _isMutating = true;
    notifyListeners();
    try {
      await _examRepository.removeParticipant(examId, userId);
      _participants = await _examRepository.listParticipants(examId);
    } finally {
      _isMutating = false;
      notifyListeners();
    }
  }
}
