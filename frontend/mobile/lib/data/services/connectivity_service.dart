import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Theo dõi trạng thái mạng để kích hoạt đồng bộ khi học sinh làm bài
/// ngoài vùng phủ sóng rồi kết nối lại.
///
/// Cài đặt [Listenable] để dùng trực tiếp với `ListenableBuilder`.
class ConnectivityService extends ChangeNotifier {
  ConnectivityService() {
    _subscription = Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online != _isOnline) {
        _isOnline = online;
        notifyListeners();
      }
    });
    _refresh();
  }

  StreamSubscription<List<ConnectivityResult>>? _subscription;

  bool _isOnline = true;

  /// `true` khi thiết bị có kết nối mạng.
  bool get isOnline => _isOnline;

  /// Đồng bộ lại trạng thái (gọi khi app resume).
  Future<void> refresh() => _refresh();

  Future<void> _refresh() async {
    final results = await Connectivity().checkConnectivity();
    final online = results.any((r) => r != ConnectivityResult.none);
    if (online != _isOnline) {
      _isOnline = online;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
