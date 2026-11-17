import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../ui/features/auth/views/login_view.dart';
import '../ui/features/auth/views/profile_view.dart';
import '../ui/features/paper_exams/views/paper_exam_detail_view.dart';
import '../ui/features/paper_exams/views/paper_exam_form_view.dart';
import '../ui/features/paper_exams/views/paper_exam_list_view.dart';
import '../ui/features/paper_exams/views/scan_result_detail_view.dart';
import '../ui/features/paper_exams/views/scan_view.dart';
import './guards.dart';
import './shell/app_shell.dart';
import '../ui/features/auth/view_models/auth_view_model.dart';

/// Router của app — kèm redirect guard theo role.
///
/// App mobile chỉ phục vụ paper exam nên toàn bộ route sau `/login` đều nằm
/// trong [AppShell].
GoRouter buildRouter({
  required String initialLocation,
  required AuthViewModel auth,
}) {
  final rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');
  final shellKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: initialLocation,
    debugLogDiagnostics: false,
    // `AuthViewModel` là ChangeNotifier nên router tự đánh giá lại redirect
    // mỗi khi trạng thái phiên đổi.
    refreshListenable: auth,
    redirect: (context, state) {
      final location = state.matchedLocation;
      return AppRouteGuard.resolve(location: location, user: auth.user);
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginView(),
      ),

      // Shell chứa toàn bộ màn hình đã đăng nhập.
      ShellRoute(
        navigatorKey: shellKey,
        builder: (context, state, child) => AppShell(
          location: state.matchedLocation,
          user: auth.user!,
          child: child,
        ),
        routes: [
          // Các route tĩnh phải khai báo trước route có tham số `:id`
          // để go_router không nhầm "new"/"scan-results" với id đề giấy.
          GoRoute(
            path: '/paper-exams',
            name: 'paper-exams',
            builder: (context, state) => const PaperExamListView(),
          ),
          GoRoute(
            path: '/paper-exams/new',
            name: 'paper-exam-new',
            builder: (context, state) => const PaperExamFormView(),
          ),
          GoRoute(
            path: '/paper-exams/scan-results/:id',
            name: 'paper-exam-scan-result',
            builder: (context, state) => ScanResultDetailView(
              scanResultId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/paper-exams/:id',
            name: 'paper-exam-detail',
            builder: (context, state) => PaperExamDetailView(
              paperExamId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/paper-exams/:id/scan',
            name: 'paper-exam-scan',
            builder: (context, state) => ScanView(
              paperExamId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            builder: (context, state) => const ProfileView(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => _NotFoundView(location: state.uri.toString()),
  );
}

class _NotFoundView extends StatelessWidget {
  const _NotFoundView({required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Không tìm thấy trang')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Không tìm thấy đường dẫn "$location".',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
      ),
    );
  }
}
