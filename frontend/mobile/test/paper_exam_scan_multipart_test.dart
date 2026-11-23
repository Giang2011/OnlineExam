import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

/// Chốt hồi quy cho lỗi multipart: mỗi ảnh phải là một part `images` riêng.
///
/// `FormData.fromMap` nhận `Map` — lặp lại key `'images'` sẽ **ghi đè** part
/// trước, khiến server chỉ nhận được trang cuối cùng. Phải gom ảnh vào một
/// list dưới cùng key.
void main() {
  group('FormData scan nhiều trang', () {
    test('mỗi ảnh là một part images riêng biệt', () {
      final form = FormData.fromMap({
        'images': [
          MultipartFile.fromBytes(List<int>.filled(4, 1), filename: 'page1.jpg'),
          MultipartFile.fromBytes(List<int>.filled(4, 2), filename: 'page2.jpg'),
        ],
        'scanMode': 'AUTO',
      });

      expect(form.files.length, 2);
      expect(form.files.map((e) => e.key).toSet(), {'images'});
      expect(
        form.files.map((e) => e.value.filename).toList(),
        ['page1.jpg', 'page2.jpg'],
      );
    });

    test('lặp key images trong map chỉ giữ lại trang cuối', () {
      // Đây là hành vi sai mà bug đã gặp — giữ lại để chốt hồi quy.
      // Dựng map bằng `Map.fromEntries` để tránh lint `equal_keys_in_map`
      // (map literal với key lặp sẽ bị analyzer chặn).
      final form = FormData.fromMap(
        Map.fromEntries(<MapEntry<String, MultipartFile>>[
          MapEntry(
            'images',
            MultipartFile.fromBytes(List<int>.filled(4, 1), filename: 'page1.jpg'),
          ),
          MapEntry(
            'images',
            MultipartFile.fromBytes(List<int>.filled(4, 2), filename: 'page2.jpg'),
          ),
        ]),
      );

      expect(form.files.length, 1);
      expect(form.files.single.value.filename, 'page2.jpg');
    });
  });
}
