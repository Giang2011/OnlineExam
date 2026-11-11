import { api } from '@/shared/lib/api-client';
import type { AuthUser } from '@/shared/types/common';
import type { LoginRequest, LoginResponse, UpdateSelfRequest } from '@/features/auth/types';

export const authApi = {
  login: (payload: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', payload, { skipUnauthorizedHandling: true }),

  logout: () => api.post<void>('/auth/logout', undefined, { skipUnauthorizedHandling: true }),

  me: () => api.get<AuthUser>('/auth/me', { skipUnauthorizedHandling: true }),

  updateSelf: (payload: UpdateSelfRequest) => api.put<AuthUser>('/users/me', payload),
};
