import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../ui/features/auth/views/login_view.dart';
import '../ui/features/auth/views/profile_view.dart';
import '../ui/features/exam_taking/views/exam_taking_view.dart';
import '../ui/features/exam_taking/views/student_exam_list_view.dart';
import '../ui/features/exams/views/exam_detail_view.dart';
import '../ui/features/exams/views/exam_form_view.dart';
import '../ui/features/exams/views/exam_list_view.dart';
import '../ui/features/paper_exams/views/paper_exam_detail_view.dart';
import '../ui/features/paper_exams/views/paper_exam_form_view.dart';
import '../ui/features/paper_exams/views/paper_exam_list_view.dart';
import '../ui/features/paper_exams/views/scan_view.dart';
import '../ui/features/questions/views/question_form_view.dart';
import '../ui/features/questions/views/question_list_view.dart';
import '../ui/features/results/views/exam_results_view.dart';
import '../ui/features/results/views/my_results_view.dart';
import '../ui/features/results/views/results_exam_picker_view.dart';
import '../ui/features/subjects/views/subject_detail_view.dart';
import '../ui/features/subjects/views/subject_list_view.dart';
import '../ui/features/users/views/user_list_view.dart';
import './guards.dart';
import './shell/app_shell.dart';
import '../ui/features/auth/view_models/auth_view_model.dart';

/// Router của app — kèm redirect guard theo role.
///
/// Tất cả route sau `/login` đều nằm trong [AppShell] để có bottom nav / rail.
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
          // --- STUDENT ---
          GoRoute(
            path: '/my-exams',
            name: 'my-exams',
            builder: (context, state) => const StudentExamListView(),
          ),
          GoRoute(
            path: '/exam-taking/:sessionId',
            name: 'exam-taking',
            builder: (context, state) => ExamTakingView(
              sessionId: int.parse(state.pathParameters['sessionId']!),
            ),
          ),
          GoRoute(
            path: '/my-results',
            name: 'my-results',
            builder: (context, state) => const MyResultsView(),
          ),

          // --- GIÁO VIÊN / ADMIN ---
          GoRoute(
            path: '/exams',
            name: 'exams',
            builder: (context, state) => const ExamListView(),
          ),
          GoRoute(
            path: '/exams/new',
            name: 'exam-new',
            builder: (context, state) => const ExamFormView(),
          ),
          GoRoute(
            path: '/exams/:id',
            name: 'exam-detail',
            builder: (context, state) => ExamDetailView(
              examId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/exams/:id/edit',
            name: 'exam-edit',
            builder: (context, state) => ExamFormView(
              examId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/questions',
            name: 'questions',
            builder: (context, state) => const QuestionListView(),
          ),
          GoRoute(
            path: '/questions/new',
            name: 'question-new',
            builder: (context, state) => const QuestionFormView(),
          ),
          GoRoute(
            path: '/questions/:id/edit',
            name: 'question-edit',
            builder: (context, state) => QuestionFormView(
              questionId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/subjects',
            name: 'subjects',
            builder: (context, state) => const SubjectListView(),
          ),
          GoRoute(
            path: '/subjects/:id',
            name: 'subject-detail',
            builder: (context, state) => SubjectDetailView(
              subjectId: int.parse(state.pathParameters['id']!),
            ),
          ),
          GoRoute(
            path: '/users',
            name: 'users',
            builder: (context, state) => const UserListView(),
          ),
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
            path: '/results',
            name: 'results',
            builder: (context, state) => const ResultsExamPickerView(),
          ),
          GoRoute(
            path: '/results/:examId',
            name: 'exam-results',
            builder: (context, state) => ExamResultsView(
              examId: int.parse(state.pathParameters['examId']!),
            ),
          ),

          // --- CHUNG ---
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
