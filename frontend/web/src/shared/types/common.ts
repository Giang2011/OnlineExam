export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface ApiErrorBody {
  status: number;
  message: string;
  timestamp?: string;
}

/** Trang kết quả chuẩn của Spring Data. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  studentId: string | null;
  role: Role;
}
