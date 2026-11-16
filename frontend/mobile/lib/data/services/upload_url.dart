/// Chuẩn hoá URL ảnh trả về từ API về URL tuyệt đối để load được.
///
/// `imageUrl` từ backend có thể là:
/// - filename trần: `abc.jpg`
/// - đã có prefix: `uploads/questions/abc.jpg` hoặc `/uploads/questions/abc.jpg`
/// - URL tuyệt đối: `http://...` (giữ nguyên)
/// - `null` (không có ảnh)
String? resolveUploadUrl(String? imageUrl, {required String baseUrl}) {
  if (imageUrl == null || imageUrl.trim().isEmpty) return null;

  final value = imageUrl.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('data:')) return value;

  var path = value;
  if (path.startsWith('/')) path = path.substring(1);

  // Đường dẫn đã kèm `uploads/` thì giữ nguyên, tránh sinh `/uploads/uploads/...`.
  if (path.startsWith('uploads/')) {
    return '$baseUrl/$path';
  }

  return '$baseUrl/uploads/$path';
}
