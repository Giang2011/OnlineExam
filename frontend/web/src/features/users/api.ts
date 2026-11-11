import { api } from '@/shared/lib/api-client';
import type {
  CreateStudentRequest,
  CreateTeacherRequest,
  CreatedStudent,
  UpdateUserRequest,
  User,
} from '@/features/users/types';

export const usersApi = {
  list: () => api.get<User[]>('/users'),

  detail: (id: number) => api.get<User>(`/users/${id}`),

  createStudent: (payload: CreateStudentRequest) =>
    api.post<CreatedStudent>('/users/students', payload),

  createTeacher: (payload: CreateTeacherRequest) =>
    api.post<User>('/users/teachers', payload),

  /** Partial update — chỉ gửi field muốn đổi. Backend chỉ cho sửa user role TEACHER. */
  update: (id: number, payload: UpdateUserRequest) => api.put<User>(`/users/${id}`, payload),

  remove: (id: number) => api.delete<void>(`/users/${id}`),
};
