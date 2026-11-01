export type AuthUserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType?: string;
  role?: AuthUserRole;
  user?: {
    id?: number;
    username?: string;
    name?: string | null;
    studentId?: string | null;
    role?: AuthUserRole;
  };
}

export interface AuthApiError {
  status: number;
  message: string;
  timestamp?: string;
}
