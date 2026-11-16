import 'package:material_ui/material_ui.dart';

import '../../app/app_config.dart';
import '../../data/services/upload_url.dart';

/// Ảnh tải từ backend — tự chuẩn hoá URL qua [resolveUploadUrl].
///
/// `imageUrl` từ API có thể là filename trần, `uploads/...` hoặc `/uploads/...`
/// nên không được ghép trực tiếp.
class NetworkImageView extends StatelessWidget {
  const NetworkImageView({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.contain,
    this.height,
  });

  final String? imageUrl;
  final BoxFit fit;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final url = resolveUploadUrl(imageUrl, baseUrl: AppConfig.origin);
    if (url == null) return const SizedBox.shrink();

    return Image.network(
      url,
      fit: fit,
      height: height,
      errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return SizedBox(
          height: height ?? 120,
          child: const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        );
      },
    );
  }
}
