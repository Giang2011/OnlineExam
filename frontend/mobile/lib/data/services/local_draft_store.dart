import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// Lưu trữ cục bộ cho draft đáp án khi học sinh làm bài mất mạng.
///
/// Backend có `PUT /sessions/{id}/answers` (autosave) nhưng nếu mạng rớt giữa
/// chừng thì đáp án trên server sẽ stale. Ta ghi **mọi** thay đổi xuống SQLite
/// trước, rồi mới đẩy lên server — nhờ vậy kill app giữa kỳ thi không mất bài.
class LocalDraftStore {
  LocalDraftStore._(this._db);

  final Database _db;

  static const String tableDraft = 'draft_answers';
  static const String tablePending = 'pending_push';

  /// Mở database (lazy — chỉ tạo file khi cần).
  static Future<LocalDraftStore> open() async {
    final dir = await getDatabasesPath();
    final path = p.join(dir, 'exam_mobile.db');
    final db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $tableDraft (
            sessionId INTEGER NOT NULL,
            variantQuestionId INTEGER NOT NULL,
            selectedAnswerIds TEXT NOT NULL,
            updatedAt INTEGER NOT NULL,
            PRIMARY KEY (sessionId, variantQuestionId)
          )
        ''');
        await db.execute('''
          CREATE TABLE $tablePending (
            sessionId INTEGER NOT NULL,
            payload TEXT NOT NULL,
            updatedAt INTEGER NOT NULL,
            PRIMARY KEY (sessionId)
          )
        ''');
      },
    );
    return LocalDraftStore._(db);
  }

  /// Ghi một đáp án đã chọn. `selectedAnswerIds` lưu dạng JSON array.
  Future<void> saveDraft({
    required int sessionId,
    required int variantQuestionId,
    required List<int> selectedAnswerIds,
  }) async {
    await _db.insert(
      tableDraft,
      {
        'sessionId': sessionId,
        'variantQuestionId': variantQuestionId,
        'selectedAnswerIds': _encodeIds(selectedAnswerIds),
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Xoá một đáp án (khi thí sinh bỏ chọn hết).
  Future<void> removeDraft({
    required int sessionId,
    required int variantQuestionId,
  }) async {
    await _db.delete(
      tableDraft,
      where: 'sessionId = ? AND variantQuestionId = ?',
      whereArgs: [sessionId, variantQuestionId],
    );
  }

  /// Đọc toàn bộ draft của một phiên.
  Future<Map<int, List<int>>> loadDraft(int sessionId) async {
    final rows = await _db.query(
      tableDraft,
      where: 'sessionId = ?',
      whereArgs: [sessionId],
    );
    final result = <int, List<int>>{};
    for (final row in rows) {
      final questionId = (row['variantQuestionId'] as num).toInt();
      result[questionId] = _decodeIds(row['selectedAnswerIds'] as String?);
    }
    return result;
  }

  /// Đọc draft kèm mốc thời gian — dùng để quyết định bản nào mới hơn khi gộp với server.
  Future<Map<int, DraftEntry>> loadDraftWithTimestamps(int sessionId) async {
    final rows = await _db.query(
      tableDraft,
      where: 'sessionId = ?',
      whereArgs: [sessionId],
    );
    final result = <int, DraftEntry>{};
    for (final row in rows) {
      final questionId = (row['variantQuestionId'] as num).toInt();
      result[questionId] = DraftEntry(
        answerIds: _decodeIds(row['selectedAnswerIds'] as String?),
        updatedAt: (row['updatedAt'] as num?)?.toInt() ?? 0,
      );
    }
    return result;
  }

  /// Đánh dấu phiên cần đẩy lên server.
  Future<void> markPending({
    required int sessionId,
    required Map<int, List<int>> answers,
  }) async {
    await _db.insert(
      tablePending,
      {
        'sessionId': sessionId,
        'payload': _encodeAnswers(answers),
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Lấy payload đang chờ đẩy lên server.
  Future<Map<int, List<int>>?> getPending(int sessionId) async {
    final rows = await _db.query(
      tablePending,
      where: 'sessionId = ?',
      whereArgs: [sessionId],
    );
    if (rows.isEmpty) return null;
    return _decodeAnswers(rows.first['payload'] as String?);
  }

  /// Xoá hàng đợi pending sau khi đẩy thành công.
  Future<void> clearPending(int sessionId) async {
    await _db.delete(tablePending, where: 'sessionId = ?', whereArgs: [sessionId]);
  }

  /// Xoá toàn bộ dữ liệu của một phiên (sau khi nộp bài).
  Future<void> clearSession(int sessionId) async {
    await _db.delete(tableDraft, where: 'sessionId = ?', whereArgs: [sessionId]);
    await _db.delete(tablePending, where: 'sessionId = ?', whereArgs: [sessionId]);
  }

  static String _encodeIds(List<int> ids) => '[${ids.join(',')}]';

  static List<int> _decodeIds(String? raw) {
    if (raw == null || raw.isEmpty) return const [];
    final trimmed = raw.replaceAll('[', '').replaceAll(']', '').trim();
    if (trimmed.isEmpty) return const [];
    return trimmed
        .split(',')
        .where((e) => e.trim().isNotEmpty)
        .map((e) => int.tryParse(e.trim()) ?? 0)
        .where((e) => e != 0)
        .toList(growable: false);
  }

  static String _encodeAnswers(Map<int, List<int>> answers) {
    final entries = answers.entries
        .map(
          (e) => '{"variantQuestionId":${e.key},"selectedAnswerIds":${_encodeIds(e.value)}}',
        )
        .join(',');
    return '[$entries]';
  }

  static Map<int, List<int>> _decodeAnswers(String? raw) {
    if (raw == null || raw.isEmpty) return {};
    final result = <int, List<int>>{};
    // Payload do app tự sinh nên parse thủ công an toàn, không cần JSON decoder.
    final questionPattern = RegExp(
      r'"variantQuestionId":(\d+),"selectedAnswerIds":\[([0-9,]*)\]',
    );
    for (final match in questionPattern.allMatches(raw)) {
      final id = int.parse(match.group(1)!);
      result[id] = _decodeIds(match.group(2));
    }
    return result;
  }

  Future<void> close() => _db.close();
}

/// Một bản ghi draft kèm mốc thời gian cập nhật.
class DraftEntry {
  const DraftEntry({required this.answerIds, required this.updatedAt});

  final List<int> answerIds;
  final int updatedAt;
}
