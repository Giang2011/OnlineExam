import 'package:get_it/get_it.dart';

import '../data/repositories/auth_repository.dart';
import '../data/repositories/exam_repository.dart';
import '../data/repositories/paper_exam_repository.dart';
import '../data/repositories/question_repository.dart';
import '../data/repositories/session_repository.dart';
import '../data/repositories/user_repository.dart';
import '../data/services/api_client.dart';
import '../data/services/connectivity_service.dart';
import '../data/services/local_draft_store.dart';
import '../data/services/session_cookie_manager.dart';
import '../domain/use_cases/chapter_config_validator.dart';
import '../domain/use_cases/sync_answers_use_case.dart';

final GetIt sl = GetIt.instance;

/// Cấu hình dependency injection.
///
/// Đăng ký các Service → Repository → Use Case. ViewModel được cấp phát
/// riêng ở tầng UI vì phụ thuộc vào vòng đời widget.
Future<void> configureDependencies({
  required SessionCookieManager cookies,
  required String baseUrl,
}) async {
  sl.registerSingleton<SessionCookieManager>(cookies);

  sl.registerSingleton<ApiClient>(
    ApiClient(cookies: cookies, baseUrl: baseUrl),
  );

  sl.registerSingleton<ConnectivityService>(ConnectivityService());

  sl.registerSingleton<LocalDraftStore>(await LocalDraftStore.open());

  sl.registerSingleton<AuthRepository>(AuthRepository(sl()));
  sl.registerSingleton<QuestionRepository>(QuestionRepository(sl()));
  sl.registerSingleton<SubjectRepository>(SubjectRepository(sl()));
  sl.registerSingleton<UserRepository>(UserRepository(sl()));
  sl.registerSingleton<ExamRepository>(ExamRepository(sl()));
  sl.registerSingleton<SessionRepository>(SessionRepository(sl()));
  sl.registerSingleton<ResultRepository>(ResultRepository(sl()));
  sl.registerSingleton<PaperExamRepository>(PaperExamRepository(sl()));

  sl.registerSingleton<ChapterConfigValidator>(const ChapterConfigValidator());
  sl.registerSingleton<SyncAnswersUseCase>(SyncAnswersUseCase(sl()));
}
