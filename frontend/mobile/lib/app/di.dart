import 'package:get_it/get_it.dart';

import '../data/repositories/auth_repository.dart';
import '../data/repositories/paper_exam_repository.dart';
import '../data/repositories/subject_repository.dart';
import '../data/services/api_client.dart';
import '../data/services/connectivity_service.dart';
import '../data/services/session_cookie_manager.dart';
import '../domain/use_cases/paper_exam_config_validator.dart';

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

  sl.registerSingleton<AuthRepository>(AuthRepository(sl()));
  sl.registerSingleton<SubjectRepository>(SubjectRepository(sl()));
  sl.registerSingleton<PaperExamRepository>(PaperExamRepository(sl()));

  sl.registerSingleton<PaperExamConfigValidator>(
    const PaperExamConfigValidator(),
  );
}
