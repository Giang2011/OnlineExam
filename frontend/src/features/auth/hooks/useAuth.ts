import { authStorage } from '../../../shared/lib/authStorage';
import type { AuthUserRole } from '../types/auth.types';

export const getLandingPathByRole = (role: AuthUserRole | null): string => {
  if (role === 'ADMIN' || role === 'TEACHER') {
    return '/admin/subjects';
  }

  return '/student/exams';
};

interface UseAuthResult {
  token: string | null;
  role: AuthUserRole | null;
  name: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  getLandingPath: () => string;
  isAdminOrTeacher: boolean;
  isStudent: boolean;
}

export const useAuth = (): UseAuthResult => {
  const token = authStorage.getToken();
  const role = authStorage.getRole() as AuthUserRole | null;
  const name = authStorage.getName();

  const isAuthenticated = Boolean(token);

  const logout = () => {
    authStorage.clear();
  };

  return {
    token,
    role,
    name,
    isAuthenticated,
    logout,
    getLandingPath: () => getLandingPathByRole(role),
    isAdminOrTeacher: role === 'ADMIN' || role === 'TEACHER',
    isStudent: role === 'STUDENT',
  };
};
