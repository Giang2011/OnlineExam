import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getLandingPathByRole } from '../../features/auth/hooks/useAuth';
import { authStorage } from '../../shared/lib/authStorage';

import AuthLayout from '../../features/auth/layouts/AuthLayout';
import Login from '../../features/auth/pages/Login';

import StudentLayout from '../../features/student/layouts/StudentLayout';
import ExamList from '../../features/student/pages/ExamList';
import ExamDetail from '../../features/student/pages/ExamDetail';
import ExamInterface from '../../features/student/pages/ExamInterface';
import MyResults from '../../features/student/pages/MyResults';
import ResultDetail from '../../features/student/pages/ResultDetail';
import ExamCompleted from '../../features/student/pages/ExamCompleted';

import AdminLayout from '../../features/admin/layouts/AdminLayout';
import UserManagement from '../../features/admin/pages/UserManagement';
import SubjectManagement from '../../features/admin/pages/SubjectManagement';
import QuestionManagement from '../../features/admin/pages/QuestionManagement';
import ExamManagement from '../../features/admin/pages/ExamManagement';
import ParticipantManagement from '../../features/admin/pages/ParticipantManagement';
import ExamReports from '../../features/admin/pages/ExamReports';
import Profile from '../../features/admin/pages/Profile';
import PaperExamManagement from '../../features/admin/pages/PaperExamManagement';
import PaperExamCreate from '../../features/admin/pages/PaperExamCreate';
import PaperExamDetail from '../../features/admin/pages/PaperExamDetail';
import PaperExamAnswers from '../../features/admin/pages/PaperExamAnswers';
import PaperExamScan from '../../features/admin/pages/PaperExamScan';
import PaperExamScanResults from '../../features/admin/pages/PaperExamScanResults';
import PaperExamScanResultDetail from '../../features/admin/pages/PaperExamScanResultDetail';

import { AdminTeacherGuard, StudentGuard } from './guards';

const RootRedirect: React.FC = () => {
  const token = authStorage.getToken();
  const role = authStorage.getRole();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Navigate to={getLandingPathByRole(role)} replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />

      <Route element={<StudentGuard />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="exams" element={<ExamList />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="sessions/:sessionId" element={<ExamInterface />} />
          <Route path="results" element={<MyResults />} />
          <Route path="results/:sessionId" element={<ResultDetail />} />
          <Route path="completed" element={<ExamCompleted />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<AdminTeacherGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="users" element={<UserManagement />} />

          <Route path="reports" element={<ExamReports />} />
          <Route path="subjects" element={<SubjectManagement />} />
          <Route path="questions" element={<QuestionManagement />} />
          <Route path="exams" element={<ExamManagement />} />
          <Route path="exams/:id/participants" element={<ParticipantManagement />} />
          <Route path="paper-exams" element={<PaperExamManagement />} />
          <Route path="paper-exams/create" element={<PaperExamCreate />} />
          <Route path="paper-exams/:id" element={<PaperExamDetail />} />
          <Route path="paper-exams/:id/answers" element={<PaperExamAnswers />} />
          <Route path="paper-exams/:id/scan" element={<PaperExamScan />} />
          <Route path="paper-exams/:id/scan-results" element={<PaperExamScanResults />} />
          <Route path="paper-exams/scan-results/:scanResultId" element={<PaperExamScanResultDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
