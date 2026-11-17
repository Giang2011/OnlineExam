import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import 'app/app_config.dart';
import 'app/di.dart';
import 'app/router.dart';
import 'app/theme/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/paper_exam_repository.dart';
import 'data/repositories/subject_repository.dart';
import 'data/services/api_client.dart';
import 'data/services/connectivity_service.dart';
import 'data/services/session_cookie_manager.dart';
import 'domain/use_cases/paper_exam_config_validator.dart';
import 'ui/features/auth/view_models/auth_view_model.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final cookies = await SessionCookieManager.create(baseUrl: AppConfig.baseUrl);
  await configureDependencies(cookies: cookies, baseUrl: AppConfig.baseUrl);

  final auth = AuthViewModel(sl<AuthRepository>());

  runApp(ExamMobileApp(auth: auth));
}

class ExamMobileApp extends StatefulWidget {
  const ExamMobileApp({super.key, required this.auth});

  final AuthViewModel auth;

  @override
  State<ExamMobileApp> createState() => _ExamMobileAppState();
}

class _ExamMobileAppState extends State<ExamMobileApp> {
  late final _router = buildRouter(
    initialLocation: '/login',
    auth: widget.auth,
  );

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // 401 từ bất kỳ request nào → xoá phiên và đưa về màn đăng nhập.
    sl<ApiClient>().onUnauthorized = widget.auth.handleUnauthorized;

    await widget.auth.restoreSession();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthViewModel>.value(value: widget.auth),
        ChangeNotifierProvider<ConnectivityService>.value(
          value: sl<ConnectivityService>(),
        ),
        Provider<ApiClient>.value(value: sl<ApiClient>()),
        // Repository và UseCase lấy từ service locator nhưng vẫn được expose qua
        // Provider để View đọc được bằng `context.read<T>()`.
        Provider<SubjectRepository>.value(value: sl<SubjectRepository>()),
        Provider<PaperExamRepository>.value(value: sl<PaperExamRepository>()),
        Provider<PaperExamConfigValidator>.value(
          value: sl<PaperExamConfigValidator>(),
        ),
      ],
      child: MaterialApp.router(
        title: 'Phòng Thi',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        routerConfig: _router,
        builder: (context, child) {
          // Tôn trọng `disableAnimations` của hệ điều hành.
          final disableAnimations = MediaQuery.disableAnimationsOf(context);
          return MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(disableAnimations: disableAnimations),
            child: child ?? const SizedBox.shrink(),
          );
        },
      ),
    );
  }
}
