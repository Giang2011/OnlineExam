import 'package:meta/meta.dart';

/// Vai trò người dùng. Backend trả về chuỗi `ADMIN` | `TEACHER` | `STUDENT`.
enum Role {
  admin('ADMIN'),
  teacher('TEACHER'),
  student('STUDENT');

  const Role(this.wire);

  /// Giá trị đúng như backend trả về.
  final String wire;

  static Role? fromWire(String? value) {
    for (final role in Role.values) {
      if (role.wire == value) return role;
    }
    return null;
  }

  bool get isStaff => this == Role.admin || this == Role.teacher;
}

@immutable
class AppUser {
  const AppUser({
    required this.id,
    required this.username,
    required this.name,
    required this.role,
    this.studentId,
  });

  final int id;
  final String username;
  final String name;
  final Role role;
  final String? studentId;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] as num).toInt(),
      username: json['username'] as String? ?? '',
      name: json['name'] as String? ?? '',
      studentId: json['studentId'] as String?,
      role: Role.fromWire(json['role'] as String?) ?? Role.student,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'name': name,
    'studentId': studentId,
    'role': role.wire,
  };

  /// Bản sao với thông tin cập nhật — dùng sau `PUT /users/me`.
  AppUser copyWith({String? username, String? name, String? studentId}) {
    return AppUser(
      id: id,
      username: username ?? this.username,
      name: name ?? this.name,
      studentId: studentId ?? this.studentId,
      role: role,
    );
  }
}
