import 'package:flutter/foundation.dart';

import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/paper_exam.dart';

/// ViewModel cho màn chi tiết kết quả chấm phiếu.
class ScanResultDetailViewModel extends ChangeNotifier {
  ScanResultDetailViewModel(this._repository, this.scanResultId);

  final PaperExamRepository _repository;
  final int scanResultId;

  ScanResult? _result;
  bool _isLoading = true;
  String? _errorMessage;

  ScanResult? get result => _result;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _result = await _repository.scanResultById(scanResultId);
      _isLoading = false;
      notifyListeners();
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'Không tải được kết quả chấm phiếu.';
      _isLoading = false;
      notifyListeners();
    }
  }
}
