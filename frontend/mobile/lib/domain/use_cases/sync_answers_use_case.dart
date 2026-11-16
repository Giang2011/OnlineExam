import '../../data/services/local_draft_store.dart';
import '../../domain/models/exam_session.dart';

/// Gộp draft cục bộ với draft server và đẩy lên server khi có mạng.
///
/// Luồng:
/// 1. Đọc draft cục bộ (SQLite) — nguồn đáng tin cậy nhất vì ghi tức thì khi
///    học sinh chạm đáp án.
/// 2. Nếu có mạng → đẩy lên server, rồi xoá hàng đợi pending.
/// 3. Nếu mất mạng → đánh dấu pending, chờ `ConnectivityService` kích hoạt lại.
class SyncAnswersUseCase {
  const SyncAnswersUseCase(this._store);

  final LocalDraftStore _store;

  /// Đọc draft local cho phiên.
  Future<Map<int, List<int>>> loadLocalDraft(int sessionId) =>
      _store.loadDraft(sessionId);

  /// Ghi một đáp án xuống local + đánh dấu pending (đồng bộ sẽ loại bỏ cờ nếu thành công).
  Future<void> saveLocally({
    required int sessionId,
    required int variantQuestionId,
    required List<int> selectedAnswerIds,
  }) async {
    if (selectedAnswerIds.isEmpty) {
      await _store.removeDraft(
        sessionId: sessionId,
        variantQuestionId: variantQuestionId,
      );
    } else {
      await _store.saveDraft(
        sessionId: sessionId,
        variantQuestionId: variantQuestionId,
        selectedAnswerIds: selectedAnswerIds,
      );
    }
    await _store.markPending(sessionId: sessionId, answers: await _store.loadDraft(sessionId));
  }

  /// Đẩy draft local lên server qua `PUT /sessions/{id}/answers`.
  ///
  /// Trả về `true` nếu thành công. Khi thất bại, hàng đợi pending được giữ lại
  /// để thử lại lần sau.
  Future<bool> pushToServer({
    required int sessionId,
    required Future<void> Function(List<SelectedAnswer> answers) save,
  }) async {
    final draft = await _store.loadDraft(sessionId);
    if (draft.isEmpty) {
      await _store.clearPending(sessionId);
      return true;
    }

    final payload = draft.entries
        .map(
          (e) => SelectedAnswer(
            variantQuestionId: e.key,
            selectedAnswerIds: e.value,
          ),
        )
        .toList(growable: false);

    try {
      await save(payload);
      await _store.clearPending(sessionId);
      return true;
    } catch (_) {
      // Giữ nguyên pending để thử lại — không nuốt lỗi im lặng vì đây là
      // cơ chế phục hồi dữ liệu, lỗi sẽ được log ở tầng ViewModel.
      rethrow;
    }
  }

  /// Xoá toàn bộ dữ liệu local của phiên (sau khi nộp bài).
  Future<void> clearSession(int sessionId) => _store.clearSession(sessionId);

  /// Đọc payload đang chờ đẩy lên server — dùng cho badge "đang lưu cục bộ".
  Future<bool> hasPending(int sessionId) async =>
      (await _store.getPending(sessionId)) != null;
}
