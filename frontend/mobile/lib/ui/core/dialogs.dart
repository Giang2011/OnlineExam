import 'package:material_ui/material_ui.dart';

/// Dialog nhập một giá trị text — dùng chung cho tên môn học, tên chương, v.v.
///
/// Trả về `null` nếu người dùng huỷ.
Future<String?> showNameDialog(
  BuildContext context, {
  required String title,
  String initialValue = '',
  String label = 'Tên',
}) async {
  final controller = TextEditingController(text: initialValue);
  final formKey = GlobalKey<FormState>();

  final result = await showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Form(
        key: formKey,
        child: TextFormField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(labelText: label),
          validator: (value) => (value == null || value.trim().isEmpty)
              ? 'Vui lòng nhập $label.'
              : null,
          onFieldSubmitted: (value) {
            if (formKey.currentState?.validate() ?? false) {
              Navigator.of(context).pop(value.trim());
            }
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        FilledButton(
          onPressed: () {
            if (formKey.currentState?.validate() ?? false) {
              Navigator.of(context).pop(controller.text.trim());
            }
          },
          child: const Text('Lưu'),
        ),
      ],
    ),
  );

  controller.dispose();
  return result;
}

/// Dialog xác nhận — trả về `true` nếu người dùng đồng ý.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Xác nhận',
  bool isDestructive = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Hủy'),
        ),
        if (isDestructive)
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(confirmLabel),
          )
        else
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(confirmLabel),
          ),
      ],
    ),
  );
  return result ?? false;
}
