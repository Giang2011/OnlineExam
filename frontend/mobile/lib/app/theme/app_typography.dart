import 'package:google_fonts/google_fonts.dart';
import 'package:material_ui/material_ui.dart';

/// Typography "Phòng thi".
///
/// - UI: **Be Vietnam Pro** — thiết kế riêng cho tiếng Việt có dấu.
/// - Nội dung câu hỏi: **Noto Serif** — tạo cảm giác "đề giấy".
///
/// Số liệu dùng `FontFeature.tabularFigures()` để các cột số thẳng hàng.
abstract final class AppTypography {
  static const String uiFamily = 'Be Vietnam Pro';
  static const String serifFamily = 'Noto Serif';

  /// Dựng [TextTheme] từ họ font Be Vietnam Pro.
  ///
  /// `google_fonts` trả về `TextTheme` của Flutter core, còn app dùng `TextTheme`
  /// của `material_ui` — nên chuyển từng style thủ công (kiểu `TextStyle` thì
  /// dùng chung nên không cần cast).
  static TextTheme textTheme(Color ink, Color slate) {
    final base = GoogleFonts.beVietnamProTextTheme();

    return TextTheme(
      displayLarge: base.displayLarge,
      displayMedium: base.displayMedium,
      displaySmall: base.displaySmall,
      headlineLarge: base.headlineLarge,
      headlineMedium: base.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: ink,
      ),
      headlineSmall: base.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: ink,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        color: ink,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      titleSmall: base.titleSmall?.copyWith(
        fontWeight: FontWeight.w600,
        color: slate,
      ),
      bodyLarge: base.bodyLarge?.copyWith(height: 1.5, color: ink),
      bodyMedium: base.bodyMedium?.copyWith(height: 1.5, color: slate),
      bodySmall: base.bodySmall?.copyWith(height: 1.45, color: slate),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      labelMedium: base.labelMedium,
      labelSmall: base.labelSmall?.copyWith(color: slate),
    );
  }

  /// Font cho nội dung câu hỏi / văn bản dài trong đề.
  static TextStyle question(double fontSize, Color color) {
    return GoogleFonts.notoSerif(
      fontSize: fontSize,
      height: 1.55,
      color: color,
    );
  }

  /// Số liệu — dùng chữ số tabular để không nhảy layout khi đổi giá trị.
  static TextStyle numeric(
    double fontSize,
    Color color, {
    FontWeight weight = FontWeight.w600,
  }) {
    return GoogleFonts.beVietnamPro(
      fontSize: fontSize,
      fontWeight: weight,
      color: color,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }
}
