/// Scale khoảng cách — dùng hằng số có tên thay vì magic number.
abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  /// Khoảng cách tối thiểu giữa các phần tử tương tác (a11y).
  static const double minTouchTarget = 48;

  /// Bề rộng tối đa của cột nội dung để chữ không giãn quá dài trên tablet.
  static const double contentMaxWidth = 900;
}

/// Bo góc — cố ý **không đồng nhất toàn bộ** để tránh cảm giác "card kit".
abstract final class AppRadius {
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double pill = 999;

  /// Dùng cho thẻ nội dung chính.
  static const double card = 14;
}

/// Breakpoint responsive — quyết định dựa trên **không gian sẵn có**, không phải loại thiết bị.
abstract final class AppBreakpoints {
  /// Từ breakpoint này trở lên: dùng `NavigationRail` thay cho `NavigationBar`.
  static const double railMinWidth = 600;

  /// Từ breakpoint này trở lên: danh sách dạng bảng (thay vì card list).
  static const double tableMinWidth = 720;
}
