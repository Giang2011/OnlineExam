import React from 'react';
import ProtectedRoute from '../../shared/components/ProtectedRoute';

export const StudentGuard: React.FC = () => {
  return <ProtectedRoute allowedRoles={['STUDENT']} />;
};

export const AdminTeacherGuard: React.FC = () => {
  return <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']} />;
};

export const AdminOnlyGuard: React.FC = () => {
  return <ProtectedRoute allowedRoles={['ADMIN']} />;
};
