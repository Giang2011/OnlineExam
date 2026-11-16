import 'package:material_ui/material_ui.dart';

/// Bảng màu "Phòng thi" — nền giấy lạnh, mực xanh, đỏ bút chấm.
///
/// Giữ đúng palette của `frontend/web` (rule `03-ui-design-system.mdc`) để hai
/// sản phẩm cùng một ngôn ngữ thị giác.
@immutable
class ExamColors extends ThemeExtension<ExamColors> {
  const ExamColors({
    required this.paper,
    required this.ink,
    required this.slate,
    required this.chalk,
    required this.pen,
    required this.jade,
    required this.paperElevated,
    required this.hairline,
  });

  /// Nền giấy lạnh (không phải kem ấm).
  final Color paper;

  /// Chữ / đường chính — xanh đen có sắc.
  final Color ink;

  /// Chữ phụ.
  final Color slate;

  /// Xanh mực — màu hành động chính.
  final Color chalk;

  /// Đỏ bút chấm — cảnh báo / sai / hết giờ.
  final Color pen;

  /// Xanh lá — đúng / hoàn thành.
  final Color jade;

  /// Nền nổi cao hơn `paper` (thẻ, sheet).
  final Color paperElevated;

  /// Đường viền mảnh.
  final Color hairline;

  static const ExamColors light = ExamColors(
    paper: Color(0xFFF4F6F9),
    ink: Color(0xFF131C2B),
    slate: Color(0xFF5A6478),
    chalk: Color(0xFF2B5F8A),
    pen: Color(0xFFB4232A),
    jade: Color(0xFF1F7A5C),
    paperElevated: Color(0xFFFFFFFF),
    hairline: Color(0xFFDCE1E9),
  );

  static const ExamColors dark = ExamColors(
    paper: Color(0xFF10151D),
    ink: Color(0xFFE8ECF2),
    slate: Color(0xFF9AA5B8),
    chalk: Color(0xFF6BA3D2),
    pen: Color(0xFFE2686E),
    jade: Color(0xFF46B48C),
    paperElevated: Color(0xFF1A212B),
    hairline: Color(0xFF2C3542),
  );

  @override
  ExamColors copyWith({
    Color? paper,
    Color? ink,
    Color? slate,
    Color? chalk,
    Color? pen,
    Color? jade,
    Color? paperElevated,
    Color? hairline,
  }) {
    return ExamColors(
      paper: paper ?? this.paper,
      ink: ink ?? this.ink,
      slate: slate ?? this.slate,
      chalk: chalk ?? this.chalk,
      pen: pen ?? this.pen,
      jade: jade ?? this.jade,
      paperElevated: paperElevated ?? this.paperElevated,
      hairline: hairline ?? this.hairline,
    );
  }

  @override
  ExamColors lerp(ThemeExtension<ExamColors>? other, double t) {
    if (other is! ExamColors) return this;
    return ExamColors(
      paper: Color.lerp(paper, other.paper, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      slate: Color.lerp(slate, other.slate, t)!,
      chalk: Color.lerp(chalk, other.chalk, t)!,
      pen: Color.lerp(pen, other.pen, t)!,
      jade: Color.lerp(jade, other.jade, t)!,
      paperElevated: Color.lerp(paperElevated, other.paperElevated, t)!,
      hairline: Color.lerp(hairline, other.hairline, t)!,
    );
  }
}

/// Tiện ích đọc nhanh token màu trong widget.
extension ExamColorsX on BuildContext {
  ExamColors get examColors => Theme.of(this).extension<ExamColors>()!;
}
