import type { AuthUser, Role } from '@/shared/types/common';

export interface User extends AuthUser {
  active?: boolean;
}

export interface CreateStudentRequest {
  studentId: string;
  name: string;
}

/** Response trả credentials chỉ 1 lần duy nhất khi tạo học sinh. */
export interface CreatedStudent extends User {
  password: string;
}

export interface CreateTeacherRequest {
  username: string;
  password: string;
  name: string;
}

/** Partial update — chỉ gửi field muốn đổi. */
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  name?: string;
}

export type { Role };
