import type { AuthUser, Role } from '@/shared/types/common';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  role: Role;
}

export interface UpdateSelfRequest {
  username?: string;
  password?: string;
  name?: string;
}
