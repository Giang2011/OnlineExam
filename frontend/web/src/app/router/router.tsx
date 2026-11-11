import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/app/layouts/AppShell';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { ExamLayout } from '@/app/layouts/ExamLayout';
import { RequireAuth } from '@/app/guards/RequireAuth';
import { RequireRole } from '@/app/guards/RequireRole';
import { GuestOnly } from '@/app/guards/GuestOnly';
import { SessionBridge } from '@/app/router/SessionBridge';
import { RoleHome } from '@/app/router/RoleHome';
import { NotFoundPage } from '@/app/router/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <SessionBridge />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: '/login',
                lazy: async () => {
                  const { LoginPage } = await import('@/features/auth/pages/LoginPage');
                  return { Component: LoginPage };
                },
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <RoleHome /> },
              {
                path: '/profile',
                lazy: async () => {
                  const { ProfilePage } = await import('@/features/auth/pages/ProfilePage');
                  return { Component: ProfilePage };
                },
              },

              {
                element: <RequireRole roles={['ADMIN', 'TEACHER']} />,
                children: [
                  {
                    path: '/users',
                    lazy: async () => {
                      const { UserListPage } = await import('@/features/users/pages/UserListPage');
                      return { Component: UserListPage };
                    },
                  },
                  {
                    path: '/subjects',
                    lazy: async () => {
                      const { SubjectListPage } = await import('@/features/subjects/pages/SubjectListPage');
                      return { Component: SubjectListPage };
                    },
                  },
                  {
                    path: '/questions',
                    lazy: async () => {
                      const { QuestionListPage } = await import('@/features/questions/pages/QuestionListPage');
                      return { Component: QuestionListPage };
                    },
                  },
                  {
                    path: '/exams',
                    lazy: async () => {
                      const { ExamListPage } = await import('@/features/exams/pages/ExamListPage');
                      return { Component: ExamListPage };
                    },
                  },
                  {
                    path: '/exams/new',
                    lazy: async () => {
                      const { ExamFormPage } = await import('@/features/exams/pages/ExamFormPage');
                      return { Component: ExamFormPage };
                    },
                  },
                  {
                    path: '/exams/:examId',
                    lazy: async () => {
                      const { ExamDetailPage } = await import('@/features/exams/pages/ExamDetailPage');
                      return { Component: ExamDetailPage };
                    },
                  },
                  {
                    path: '/exams/:examId/edit',
                    lazy: async () => {
                      const { ExamFormPage } = await import('@/features/exams/pages/ExamFormPage');
                      return { Component: ExamFormPage };
                    },
                  },
                  {
                    path: '/paper-exams',
                    lazy: async () => {
                      const { PaperExamListPage } = await import('@/features/paper-exams/pages/PaperExamListPage');
                      return { Component: PaperExamListPage };
                    },
                  },
                  {
                    path: '/paper-exams/new',
                    lazy: async () => {
                      const { PaperExamFormPage } = await import('@/features/paper-exams/pages/PaperExamFormPage');
                      return { Component: PaperExamFormPage };
                    },
                  },
                  {
                    path: '/paper-exams/:paperExamId',
                    lazy: async () => {
                      const { PaperExamDetailPage } = await import('@/features/paper-exams/pages/PaperExamDetailPage');
                      return { Component: PaperExamDetailPage };
                    },
                  },
                  {
                    path: '/paper-exams/:paperExamId/edit',
                    lazy: async () => {
                      const { PaperExamFormPage } = await import('@/features/paper-exams/pages/PaperExamFormPage');
                      return { Component: PaperExamFormPage };
                    },
                  },
                  {
                    path: '/paper-exams/:paperExamId/scan',
                    lazy: async () => {
                      const { PaperExamScanPage } = await import('@/features/paper-exams/pages/PaperExamScanPage');
                      return { Component: PaperExamScanPage };
                    },
                  },
                  {
                    path: '/paper-exams/scan-results/:scanResultId',
                    lazy: async () => {
                      const { ScanResultDetailPage } = await import('@/features/paper-exams/pages/ScanResultDetailPage');
                      return { Component: ScanResultDetailPage };
                    },
                  },
                  {
                    path: '/results',
                    lazy: async () => {
                      const { ResultsHomePage } = await import('@/features/results/pages/ResultsHomePage');
                      return { Component: ResultsHomePage };
                    },
                  },
                  {
                    path: '/results/exam/:examId',
                    lazy: async () => {
                      const { ExamScoreboardPage } = await import('@/features/results/pages/ExamScoreboardPage');
                      return { Component: ExamScoreboardPage };
                    },
                  },
                ],
              },

              {
                element: <RequireRole roles={['STUDENT']} />,
                children: [
                  {
                    path: '/my-exams',
                    lazy: async () => {
                      const { StudentExamListPage } = await import('@/features/exam-taking/pages/StudentExamListPage');
                      return { Component: StudentExamListPage };
                    },
                  },
                  {
                    path: '/my-results',
                    lazy: async () => {
                      const { MyResultsPage } = await import('@/features/results/pages/MyResultsPage');
                      return { Component: MyResultsPage };
                    },
                  },
                ],
              },
            ],
          },
          {
            element: <ExamLayout />,
            children: [
              {
                element: <RequireRole roles={['STUDENT']} />,
                children: [
                  {
                    path: '/exam-taking/:sessionId',
                    lazy: async () => {
                      const { TakingExamPage } = await import('@/features/exam-taking/pages/TakingExamPage');
                      return { Component: TakingExamPage };
                    },
                  },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
