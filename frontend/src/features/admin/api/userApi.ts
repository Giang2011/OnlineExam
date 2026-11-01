import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';
import type {
  AdminUser,
  CreateStudentPayload,
  CreateStudentResponse,
  CreateTeacherPayload,
  UpdateProfilePayload,
  UpdateUserPayload,
} from '../types';

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await adminApiClient.get<AdminUser[]>('/users');
  return unwrap(response);
};

export const getUserById = async (id: number | string): Promise<AdminUser> => {
  const response = await adminApiClient.get<AdminUser>(`/users/${id}`);
  return unwrap(response);
};

export const createStudent = async (payload: CreateStudentPayload): Promise<CreateStudentResponse> => {
  const response = await adminApiClient.post<CreateStudentResponse>('/users/students', payload);
  return unwrap(response);
};

export const createTeacher = async (payload: CreateTeacherPayload): Promise<AdminUser> => {
  const response = await adminApiClient.post<AdminUser>('/users/teachers', payload);
  return unwrap(response);
};

export const updateUser = async (id: number | string, payload: UpdateUserPayload): Promise<AdminUser> => {
  const response = await adminApiClient.put<AdminUser>(`/users/${id}`, payload);
  return unwrap(response);
};

export const updateMe = async (payload: UpdateProfilePayload): Promise<AdminUser> => {
  const response = await adminApiClient.put<AdminUser>('/users/me', payload);
  return unwrap(response);
};

export const deleteUser = async (id: number | string): Promise<void> => {
  await adminApiClient.delete(`/users/${id}`);
};

export const userApi = {
  getUsers,
  getUserById,
  createStudent,
  createTeacher,
  updateUser,
  updateMe,
  deleteUser,
};

export default userApi;
