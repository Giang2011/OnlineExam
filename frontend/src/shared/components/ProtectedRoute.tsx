import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getLandingPathByRole } from '../../features/auth/hooks/useAuth';
import { authStorage, type UserRole } from '../lib/authStorage';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = authStorage.getToken();
  const role = authStorage.getRole();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!role) {
    authStorage.clear();
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getLandingPathByRole(role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
