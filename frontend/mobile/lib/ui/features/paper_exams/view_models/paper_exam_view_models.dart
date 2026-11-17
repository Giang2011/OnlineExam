import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/paper_exam.dart';

/// ViewModel cho danh sách đề giấy.
class PaperExamListViewModel extends ChangeNotifier {
  PaperExamListViewModel(this._repository);

  final PaperExamRepository _repository;

  List<PaperExam> _paperExams = const [];
  bool _isLoading = true;
  String? _errorMessage;

  List<PaperExam> get paperExams => _paperExams;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _paperExams = await _repository.list();
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được danh sách đề giấy.';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> delete(int id) async {
    await _repository.delete(id);
    await load();
  }
}

/// ViewModel cho chi tiết đề giấy — tải PDF, xem đáp án, quét OMR.
class PaperExamDetailViewModel extends ChangeNotifier {
  PaperExamDetailViewModel(this._repository, this.paperExamId);

  final PaperExamRepository _repository;
  final int paperExamId;

  PaperExam? _paperExam;
  PaperExamAnswerSheet? _answerSheet;
  List<ScanResult> _scanResults = const [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isDownloading = false;

  /// Mã sinh viên tuỳ chọn để in phiếu OMR có mã riêng.
  String _studentId = '';

  PaperExam? get paperExam => _paperExam;
  PaperExamAnswerSheet? get answerSheet => _answerSheet;
  List<ScanResult> get scanResults => _scanResults;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isDownloading => _isDownloading;
  String get studentId => _studentId;

  void setStudentId(String value) {
    _studentId = value.trim();
    notifyListeners();
  }

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _paperExam = await _repository.getById(paperExamId);
      _scanResults = await _repository.scanResults(paperExamId);
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được thông tin đề giấy.';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Nạp đáp án — chỉ khi `showAnswers` bật.
  Future<void> loadAnswers() async {
    try {
      _answerSheet = await _repository.answers(paperExamId);
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      notifyListeners();
    }
  }

  /// Tải PDF đề giấy và ghi ra thư mục tài liệu.
  Future<File?> downloadPdf() async {
    return _download(
      fileName: 'de-$paperExamId.pdf',
      fetch: () => _repository.downloadPdf(paperExamId),
      errorMessage: 'Không tải được file PDF đề giấy.',
    );
  }

  /// Tải PDF phiếu trả lời OMR.
  Future<File?> downloadOmrSheet() async {
    return _download(
      fileName: 'phieu-omr-$paperExamId.pdf',
      fetch: () => _repository.downloadOmrSheet(
        paperExamId,
        studentId: _studentId.isEmpty ? null : _studentId,
      ),
      errorMessage: 'Không tải được file PDF phiếu trả lời.',
    );
  }

  Future<File?> _download({
    required String fileName,
    required Future<List<int>> Function() fetch,
    required String errorMessage,
  }) async {
    _isDownloading = true;
    notifyListeners();

    try {
      final bytes = await fetch();
      final dir = await getApplicationDocumentsDirectory();
      final file = File(
        '${dir.path}${Platform.pathSeparator}$fileName',
      );
      await file.writeAsBytes(bytes, flush: true);
      _isDownloading = false;
      notifyListeners();
      return file;
    } catch (e) {
      _errorMessage = e is ApiError ? e.message : errorMessage;
      _isDownloading = false;
      notifyListeners();
      return null;
    }
  }
}
