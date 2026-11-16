import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../../data/repositories/session_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../data/services/connectivity_service.dart';
import '../../../../domain/models/exam_session.dart';
import '../../../../domain/use_cases/server_countdown.dart';
import '../../../../domain/use_cases/sync_answers_use_case.dart';

/// Trạng thái màn làm bài.
enum ExamTakingStatus { loading, ready, submitting, submitted, failed }

/// ViewModel cho màn làm bài.
///
/// Ba yêu cầu cốt lõi:
/// 1. Đồng hồ **bám server** (không dùng `DateTime.now()` làm nguồn).
/// 2. Mọi đáp án ghi **cục bộ trước**, rồi mới đẩy lên server — nên mất mạng
///    không làm mất bài.
/// 3. Không bao giờ hiển thị `isCorrect` khi đang thi.
class ExamTakingViewModel extends ChangeNotifier {
  ExamTakingViewModel({
    required SessionRepository sessionRepository,
    required SyncAnswersUseCase syncAnswers,
    required ConnectivityService connectivity,
    required int sessionId,
  }) : _sessionRepository = sessionRepository,
       _syncAnswers = syncAnswers,
       _connectivity = connectivity,
       _sessionId = sessionId;

  final SessionRepository _sessionRepository;
  final SyncAnswersUseCase _syncAnswers;
  final ConnectivityService _connectivity;
  final int _sessionId;

  ExamTakingStatus _status = ExamTakingStatus.loading;
  ExamSession? _session;
  List<SessionQuestion> _questions = const [];

  /// Đáp án đã chọn: `variantQuestionId` → danh sách `answerId`.
  final Map<int, List<int>> _answers = {};

  String? _errorMessage;
  int _currentIndex = 0;
  int _tick = 0;
  bool _isOnline = true;
  bool _hasPendingSync = false;

  Timer? _tickTimer;
  Timer? _autosaveTimer;

  ExamTakingStatus get status => _status;
  ExamSession? get session => _session;
  List<SessionQuestion> get questions => _questions;
  String? get errorMessage => _errorMessage;
  int get currentIndex => _currentIndex;
  bool get isOnline => _isOnline;

  /// `true` khi có đáp án đang chờ đẩy lên server.
  bool get hasPendingSync => _hasPendingSync;

  SessionQuestion? get currentQuestion =>
      _currentIndex < _questions.length ? _questions[_currentIndex] : null;

  /// Đáp án đã chọn của câu hiện tại.
  List<int> get currentSelectedAnswerIds {
    final question = currentQuestion;
    if (question == null) return const [];
    return _answers[question.variantQuestionId] ?? const [];
  }

  /// Index (0-based) của các câu đã trả lời — dùng cho lưới OMR.
  Set<int> get answeredIndexes {
    final result = <int>{};
    for (var i = 0; i < _questions.length; i++) {
      final id = _questions[i].variantQuestionId;
      final selected = _answers[id];
      if (selected != null && selected.isNotEmpty) result.add(i);
    }
    return result;
  }

  /// Đồng hồ đếm ngược bám server.
  ServerCountdown get countdown {
    final session = _session;
    if (session == null) {
      return ServerCountdown(
        serverTime: DateTime.fromMillisecondsSinceEpoch(0),
        deadlineAt: DateTime.fromMillisecondsSinceEpoch(0),
        remainingSeconds: 0,
        elapsedTicks: _tick,
      );
    }
    return countdownFrom(session, elapsedTicks: _tick);
  }

  /// Khởi tạo: nạp phiên, đề thi, draft (server + local) và bắt đầu đồng hồ.
  Future<void> init() async {
    _status = ExamTakingStatus.loading;
    notifyListeners();

    try {
      final session = await _sessionRepository.getById(_sessionId);
      _session = session;

      final questions = await _sessionRepository.questions(_sessionId);
      _questions = questions;

      // Nạp draft server trước, rồi ghi đè bằng bản cục bộ (bản local luôn mới hơn).
      final serverDraft = await _sessionRepository.answers(_sessionId);
      for (final answer in serverDraft.answers) {
        _answers[answer.variantQuestionId] = answer.selectedAnswerIds;
      }

      final localDraft = await _syncAnswers.loadLocalDraft(_sessionId);
      _answers.addAll(localDraft);

      _hasPendingSync = await _syncAnswers.hasPending(_sessionId);

      _isOnline = _connectivity.isOnline;
      _connectivity.addListener(_handleConnectivityChanged);

      _status = ExamTakingStatus.ready;
      _startTimers();
      notifyListeners();

      // Nếu có dữ liệu chờ đẩy và đang có mạng → đẩy ngay.
      if (_hasPendingSync && _isOnline) {
        unawaited(syncToServer());
      }
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _status = ExamTakingStatus.failed;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được đề thi. Kiểm tra lại mạng.';
      _status = ExamTakingStatus.failed;
      notifyListeners();
    }
  }

  void _startTimers() {
    _tickTimer?.cancel();
    _tickTimer = Timer.periodic(ServerCountdown.tickInterval, (_) {
      _tick++;
      notifyListeners();

      // Hết giờ → tự nộp bài dùng draft đã lưu.
      if (countdown.isExpired && _status == ExamTakingStatus.ready) {
        unawaited(submit());
      }
    });

    _autosaveTimer?.cancel();
    _autosaveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      if (_status == ExamTakingStatus.ready) unawaited(syncToServer());
    });
  }

  void _handleConnectivityChanged() {
    final online = _connectivity.isOnline;
    _isOnline = online;
    notifyListeners();

    // Có mạng trở lại → đẩy ngay các đáp án đang chờ.
    if (online && _hasPendingSync) {
      unawaited(syncToServer());
    }
  }

  /// Chọn / bỏ chọn đáp án.
  ///
  /// Ghi **cục bộ trước** để không mất dữ liệu khi mạng rớt, rồi đẩy lên server.
  Future<void> toggleAnswer(int answerId) async {
    final question = currentQuestion;
    if (question == null || _status != ExamTakingStatus.ready) return;

    final questionId = question.variantQuestionId;
    final selected = List<int>.from(_answers[questionId] ?? const []);

    if (question.isMultipleChoice) {
      if (selected.contains(answerId)) {
        selected.remove(answerId);
      } else {
        selected.add(answerId);
      }
    } else {
      // Câu một đáp án: chọn mới thay thế cũ.
      if (selected.contains(answerId)) {
        selected.clear();
      } else {
        selected
          ..clear()
          ..add(answerId);
      }
    }

    if (selected.isEmpty) {
      _answers.remove(questionId);
    } else {
      _answers[questionId] = selected;
    }
    notifyListeners();

    await _syncAnswers.saveLocally(
      sessionId: _sessionId,
      variantQuestionId: questionId,
      selectedAnswerIds: selected,
    );
    _hasPendingSync = true;
    notifyListeners();

    if (_isOnline) unawaited(syncToServer());
  }

  /// Chuyển sang câu khác.
  void goToQuestion(int index) {
    if (index < 0 || index >= _questions.length) return;
    _currentIndex = index;
    notifyListeners();
  }

  void nextQuestion() => goToQuestion(_currentIndex + 1);

  void previousQuestion() => goToQuestion(_currentIndex - 1);

  /// Đẩy đáp án lên server (`PUT /sessions/{id}/answers`).
  Future<bool> syncToServer() async {
    if (!_isOnline) return false;

    try {
      await _syncAnswers.pushToServer(
        sessionId: _sessionId,
        save: (answers) async {
          await _sessionRepository.saveAnswers(_sessionId, answers);
        },
      );
      _hasPendingSync = false;
      notifyListeners();
      return true;
    } catch (_) {
      // Giữ draft cục bộ — sẽ thử lại ở nhịp autosave tiếp theo hoặc khi có mạng.
      _hasPendingSync = true;
      notifyListeners();
      return false;
    }
  }

  /// Nộp bài (`POST /sessions/{id}/submit`).
  Future<void> submit() async {
    if (_status == ExamTakingStatus.submitting ||
        _status == ExamTakingStatus.submitted) {
      return;
    }

    _status = ExamTakingStatus.submitting;
    notifyListeners();

    final payload = _answers.entries
        .map(
          (e) => SelectedAnswer(
            variantQuestionId: e.key,
            selectedAnswerIds: e.value,
          ),
        )
        .toList(growable: false);

    try {
      final session = await _sessionRepository.submit(_sessionId, payload);
      _session = session;
      _status = ExamTakingStatus.submitted;
      await _syncAnswers.clearSession(_sessionId);
      _hasPendingSync = false;
      notifyListeners();
    } on ApiError catch (e) {
      // Server đã tự nộp (quá giờ) → lấy điểm từ API kết quả.
      if (e.status == 400 &&
          (e.message.contains('quá thời gian') ||
              e.message.contains('đã được nộp trước'))) {
        try {
          final result = await _sessionRepository.getById(_sessionId);
          _session = result;
          _status = ExamTakingStatus.submitted;
          await _syncAnswers.clearSession(_sessionId);
          notifyListeners();
          return;
        } catch (_) {
          // Không lấy được thì báo lỗi gốc.
        }
      }
      _errorMessage = e.message;
      _status = ExamTakingStatus.ready;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không gửi được bài lên máy chủ. Kiểm tra lại mạng.';
      _status = ExamTakingStatus.ready;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    _autosaveTimer?.cancel();
    _connectivity.removeListener(_handleConnectivityChanged);
    super.dispose();
  }
}
