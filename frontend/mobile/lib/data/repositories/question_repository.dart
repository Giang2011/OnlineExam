import 'dart:convert';

import 'package:dio/dio.dart';

import '../../domain/models/question.dart';
import '../services/api_client.dart';

/// Repository cho ngân hàng câu hỏi.
class QuestionRepository {
  QuestionRepository(this._api);

  final ApiClient _api;

  /// `GET /questions` — backend trả **object phân trang kiểu Spring Page**.
  ///
  /// Phải đọc `data.content`, không phải `data` trực tiếp.
  Future<PageResult<Question>> list({
    int? subjectId,
    int? chapterId,
    String? keyword,
    int page = 0,
    int size = 20,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/questions',
      query: {
        'subjectId': ?subjectId,
        'chapterId': ?chapterId,
        'keyword': ?(keyword != null && keyword.isNotEmpty ? keyword : null),
        'page': page,
        'size': size,
      },
    );
    return PageResult.fromJson(data, Question.fromJson);
  }

  /// `GET /subjects` — dùng cho bộ lọc môn học.
  Future<List<Subject>> listSubjects() async {
    final data = await _api.get<List<dynamic>>('/subjects');
    return data
        .map((e) => Subject.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /questions/{id}`.
  Future<Question> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/questions/$id');
    return Question.fromJson(data);
  }

  /// `POST /questions` — multipart.
  ///
  /// Part `data` là **chuỗi JSON** (không stringify hai lần), kèm file ảnh
  /// câu hỏi và mảng ảnh đáp án theo đúng thứ tự index.
  Future<Question> create({
    required String content,
    required int subjectId,
    required int chapterId,
    required List<Answer> answers,
    String? questionImagePath,
    List<String> answerImagePaths = const [],
  }) async {
    final payload = {
      'content': content,
      'subjectId': subjectId,
      'chapterId': chapterId,
      'answers': answers
          .map(
            (a) => {
              'content': a.content,
              'isCorrect': a.isCorrect,
            },
          )
          .toList(),
    };

    final form = FormData.fromMap({
      'data': jsonEncode(payload),
      if (questionImagePath != null)
        'questionImage': await MultipartFile.fromFile(questionImagePath),
      for (final path in answerImagePaths)
        'answerImages': await MultipartFile.fromFile(path),
    });

    final data = await _api.postMultipart<Map<String, dynamic>>(
      '/questions',
      form,
    );
    return Question.fromJson(data);
  }

  /// `PUT /questions/{id}` — multipart, có cờ xoá ảnh cũ.
  Future<Question> update({
    required int id,
    required String content,
    required int subjectId,
    required int chapterId,
    required List<Answer> answers,
    String? questionImagePath,
    List<String> answerImagePaths = const [],
    bool questionImageRemoved = false,
  }) async {
    final payload = {
      'content': content,
      'subjectId': subjectId,
      'chapterId': chapterId,
      if (questionImageRemoved) 'questionImageRemoved': true,
      'answers': answers
          .map(
            (a) => {
              'content': a.content,
              'isCorrect': a.isCorrect,
              if (a.imageRemoved) 'imageRemoved': true,
            },
          )
          .toList(),
    };

    final form = FormData.fromMap({
      'data': jsonEncode(payload),
      if (questionImagePath != null)
        'questionImage': await MultipartFile.fromFile(questionImagePath),
      for (final path in answerImagePaths)
        'answerImages': await MultipartFile.fromFile(path),
    });

    final data = await _api.putMultipart<Map<String, dynamic>>(
      '/questions/$id',
      form,
    );
    return Question.fromJson(data);
  }

  /// `DELETE /questions/{id}`.
  Future<void> delete(int id) async {
    await _api.delete<void>('/questions/$id');
  }
}

/// Repository cho môn học và chương.
class SubjectRepository {
  SubjectRepository(this._api);

  final ApiClient _api;

  /// `GET /subjects`.
  Future<List<Subject>> list() async {
    final data = await _api.get<List<dynamic>>('/subjects');
    return data
        .map((e) => Subject.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// `GET /subjects/{id}` — kèm `chapters[].questionCount`.
  Future<Subject> getById(int id) async {
    final data = await _api.get<Map<String, dynamic>>('/subjects/$id');
    return Subject.fromJson(data);
  }

  Future<Subject> create(String name) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/subjects',
      body: {'name': name},
    );
    return Subject.fromJson(data);
  }

  Future<Subject> update(int id, String name) async {
    final data = await _api.put<Map<String, dynamic>>(
      '/subjects/$id',
      body: {'name': name},
    );
    return Subject.fromJson(data);
  }

  Future<void> delete(int id) async {
    await _api.delete<void>('/subjects/$id');
  }

  /// `GET /subjects/{subjectId}/chapters`.
  Future<List<Chapter>> listChapters(int subjectId) async {
    final data = await _api.get<List<dynamic>>('/subjects/$subjectId/chapters');
    return data
        .map((e) => Chapter.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<Chapter> createChapter(int subjectId, String name) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/subjects/$subjectId/chapters',
      body: {'name': name},
    );
    return Chapter.fromJson(data);
  }

  Future<Chapter> updateChapter(int subjectId, int chapterId, String name) async {
    final data = await _api.put<Map<String, dynamic>>(
      '/subjects/$subjectId/chapters/$chapterId',
      body: {'name': name},
    );
    return Chapter.fromJson(data);
  }

  Future<void> deleteChapter(int subjectId, int chapterId) async {
    await _api.delete<void>('/subjects/$subjectId/chapters/$chapterId');
  }
}
