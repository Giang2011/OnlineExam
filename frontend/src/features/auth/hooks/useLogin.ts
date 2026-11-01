import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../shared/lib/authStorage';
import { authApi } from '../api/authApi';
import { getLandingPathByRole } from './useAuth';
import type { AuthUserRole, LoginRequest } from '../types/auth.types';

const EMPTY_CREDENTIALS: LoginRequest = {
  username: '',
  password: '',
};

const LOGIN_FAILED_FALLBACK = 'Tài khoản hoặc mật khẩu không chính xác.';

interface UseLoginResult {
  values: LoginRequest;
  loading: boolean;
  error: string;
  setField: (field: keyof LoginRequest, value: string) => void;
  submit: () => Promise<boolean>;
}

export const useLogin = (): UseLoginResult => {
  const navigate = useNavigate();

  const [values, setValues] = useState<LoginRequest>(EMPTY_CREDENTIALS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (field: keyof LoginRequest, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  };

  const submit = async (): Promise<boolean> => {
    const username = values.username.trim();
    const password = values.password.trim();

    if (!username) {
      setError('Vui lòng nhập tên đăng nhập.');
      return false;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ username, password });
      const role = response.role as AuthUserRole;

      authStorage.setToken(response.token);
      authStorage.setRole(role);

      navigate(getLandingPathByRole(role));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : LOGIN_FAILED_FALLBACK;
      setError(message || LOGIN_FAILED_FALLBACK);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    values,
    loading,
    error,
    setField,
    submit,
  };
};
