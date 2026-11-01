import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';
import type { AuthApiError, LoginRequest, LoginResponse } from '../types/auth.types';

const LOGIN_ENDPOINT = '/auth/login';

const toAuthApiError = (status: number, message: string): AuthApiError => ({
  status,
  message,
});

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${getApiBaseUrl()}${LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const raw = (await response.json().catch(() => null)) as Partial<LoginResponse> &
        Partial<AuthApiError> & {
          error?: string;
          detail?: string;
        };

      if (!response.ok) {
        const serverMessage = raw?.message || raw?.error || raw?.detail;
        const normalizedMessage = normalizeApiErrorMessage({
          response: {
            status: response.status,
            data: {
              message: serverMessage,
              error: raw?.error,
              detail: raw?.detail,
            },
          },
          message: serverMessage,
        });

        throw toAuthApiError(response.status, normalizedMessage);
      }

      const role = raw?.role ?? raw?.user?.role;

      if (!raw?.token || !role) {
        throw toAuthApiError(500, 'Phản hồi đăng nhập không hợp lệ từ máy chủ.');
      }

      return {
        token: raw.token,
        role,
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        throw error;
      }

      throw toAuthApiError(500, normalizeApiErrorMessage(error));
    }
  },
};
