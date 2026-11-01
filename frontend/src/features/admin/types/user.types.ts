export type AdminUserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  studentId: string | null;
  role: AdminUserRole;
}

export interface CreateStudentPayload {
  studentId: string;
  name: string;
}

export interface CreateTeacherPayload {
  username: string;
  password: string;
  name: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  name?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  password?: string;
  name?: string;
}

export interface GeneratedCredentials {
  username: string;
  password: string;
}

export type CreateStudentResponse = AdminUser & {
  password: string;
};
