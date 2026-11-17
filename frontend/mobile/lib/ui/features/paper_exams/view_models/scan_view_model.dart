
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../data/repositories/paper_exam_repository.dart';
import '../../../../data/services/api_error.dart';
import '../../../../domain/models/paper_exam.dart';

/// Trạng thái màn quét phiếu (khác với `ScanStatus` của domain model).
enum ScanViewStatus { idle, capturing, uploading, done, failed }

/// ViewModel cho quét phiếu OMR bằng camera.
///
/// Luồng: chụp ảnh từng trang → gửi multipart lên `POST /paper-exams/{id}/scan`
/// → backend trả kết quả chấm từng câu.
class ScanViewModel extends ChangeNotifier {
  ScanViewModel({required PaperExamRepository repository, required this.paperExamId})
    : _repository = repository;

  final PaperExamRepository _repository;
  final int paperExamId;

  CameraController? _cameraController;
  List<XFile> _capturedImages = [];
  ScanViewStatus _status = ScanViewStatus.idle;
  ScanResult? _result;
  String? _errorMessage;
  bool _isCameraReady = false;

  CameraController? get cameraController => _cameraController;
  List<XFile> get capturedImages => _capturedImages;
  ScanViewStatus get status => _status;
  ScanResult? get result => _result;
  String? get errorMessage => _errorMessage;
  bool get isCameraReady => _isCameraReady;
  int get pageCount => _capturedImages.length;

  /// Khởi tạo camera — dùng camera sau nếu có, không thì camera trước.
  Future<void> init() async {
    _status = ScanViewStatus.idle;
    notifyListeners();

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _errorMessage = 'Không tìm thấy camera trên thiết bị.';
        _status = ScanViewStatus.failed;
        notifyListeners();
        return;
      }

      final back = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      final controller = CameraController(
        back,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await controller.initialize();
      _cameraController = controller;
      _isCameraReady = true;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Không mở được camera: $e';
      _status = ScanViewStatus.failed;
      notifyListeners();
    }
  }

  /// Chụp một trang phiếu.
  Future<void> capture() async {
    final controller = _cameraController;
    if (controller == null || !controller.value.isInitialized) return;
    if (_status == ScanViewStatus.uploading) return;

    _status = ScanViewStatus.capturing;
    notifyListeners();

    try {
      final file = await controller.takePicture();
      _capturedImages = [..._capturedImages, file];
      _status = ScanViewStatus.idle;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Không chụp được ảnh: $e';
      _status = ScanViewStatus.failed;
      notifyListeners();
    }
  }

  /// Xoá ảnh vừa chụp.
  void removeLastImage() {
    if (_capturedImages.isEmpty) return;
    _capturedImages = _capturedImages.sublist(0, _capturedImages.length - 1);
    notifyListeners();
  }

  /// Xoá toàn bộ ảnh đã chụp.
  void clearImages() {
    _capturedImages = [];
    notifyListeners();
  }

  /// Thêm ảnh chọn từ thư viện — mỗi ảnh là một trang phiếu.
  Future<void> pickImagesFromGallery() async {
    if (_status == ScanViewStatus.uploading) return;

    try {
      final picked = await ImagePicker().pickMultiImage();
      if (picked.isEmpty) return;

      _capturedImages = [..._capturedImages, ...picked];
      _status = ScanViewStatus.idle;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Không chọn được ảnh: $e';
      _status = ScanViewStatus.failed;
      notifyListeners();
    }
  }

  /// Gửi ảnh lên server để chấm.
  Future<bool> submit() async {
    if (_capturedImages.isEmpty) return false;

    _status = ScanViewStatus.uploading;
    _errorMessage = null;
    notifyListeners();

    try {
      final paths = _capturedImages
          .map((f) => f.path)
          .whereType<String>()
          .toList(growable: false);

      _result = await _repository.scan(
        paperExamId: paperExamId,
        imagePaths: paths,
      );
      _status = ScanViewStatus.done;
      notifyListeners();
      return true;
    } on ApiError catch (e) {
      _errorMessage = e.message;
      _status = ScanViewStatus.failed;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Không gửi được ảnh lên máy chủ: $e';
      _status = ScanViewStatus.failed;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }
}
