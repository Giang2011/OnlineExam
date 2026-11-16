import '../../domain/models/exam_session.dart';

/// Đồng hồ đếm ngược bám theo server.
///
/// Nguồn sự thật là server: `deadlineAt` và `serverTime` nằm trong cùng một
/// response nên `(deadlineAt - serverTime) / 1000` là số giây còn lại tại thời
/// điểm server gửi response. Ta neo đồng hồ vào con số đó rồi trừ dần theo
/// thời gian thực trôi qua.
///
/// Nhờ vậy đổi tab, đổi đồng hồ máy hay mạng chậm đều không làm lệch đồng hồ.
class ServerCountdown {
  ServerCountdown({
    required this.serverTime,
    required this.deadlineAt,
    required this.remainingSeconds,
    required this.elapsedTicks,
  });

  /// Mốc thời gian server gửi kèm response.
  final DateTime serverTime;

  /// Hạn chót server-side.
  final DateTime deadlineAt;

  /// Số giây còn lại do server báo (fallback khi thiếu `deadlineAt`).
  final int remainingSeconds;

  /// Số nhịp đã trôi qua — mỗi nhịp 500ms.
  final int elapsedTicks;

  static const Duration tickInterval = Duration(milliseconds: 500);

  /// Số giây còn lại ước tính.
  int get remaining {
    final base = deadlineAt.millisecondsSinceEpoch > 0
        ? deadlineAt.difference(serverTime).inMilliseconds / 1000
        : remainingSeconds.toDouble();
    return (base - elapsedTicks * tickInterval.inMilliseconds / 1000).round();
  }

  /// `true` khi đồng hồ máy lệch quá 2 giây so với server.
  bool isDesynced(DateTime deviceNow) =>
      deviceNow.difference(serverTime).abs().inMilliseconds > 2000;

  /// Định dạng `mm:ss` hoặc `h:mm:ss`.
  String get formatted {
    final value = remaining;
    final negative = value < 0;
    final total = value.abs();
    final hours = total ~/ 3600;
    final minutes = (total % 3600) ~/ 60;
    final seconds = total % 60;

    final buffer = StringBuffer();
    if (negative) buffer.write('-');
    if (hours > 0) {
      buffer.write('$hours:');
      buffer.write(minutes.toString().padLeft(2, '0'));
    } else {
      buffer.write(minutes.toString().padLeft(2, '0'));
    }
    buffer.write(':');
    buffer.write(seconds.toString().padLeft(2, '0'));
    return buffer.toString();
  }

  /// `true` khi còn dưới 5 phút — dùng để cảnh báo.
  bool get isWarning => remaining <= 5 * 60 && remaining > 0;

  /// `true` khi đã hết giờ.
  bool get isExpired => remaining <= 0;
}

/// Tính số giây còn lại từ payload phiên thi.
ServerCountdown countdownFrom(ExamSession session, {int elapsedTicks = 0}) {
  return ServerCountdown(
    serverTime: parseServerTime(session.serverTime),
    deadlineAt: parseServerTime(session.deadlineAt),
    remainingSeconds: session.remainingSeconds,
    elapsedTicks: elapsedTicks,
  );
}

/// Parse chuỗi ISO-8601 từ server. Trả về epoch nếu không parse được.
DateTime parseServerTime(String raw) {
  if (raw.isEmpty) return DateTime.fromMillisecondsSinceEpoch(0);
  final parsed = DateTime.tryParse(raw);
  return parsed ?? DateTime.fromMillisecondsSinceEpoch(0);
}
