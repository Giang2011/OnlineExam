import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';
import type { Subject, SubjectPayload } from '../types';

export type SubjectResponse = Subject;
export type SubjectListResponse = Subject[];
export type CreateSubjectPayload = SubjectPayload;
export type UpdateSubjectPayload = SubjectPayload;

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const normalizeSubjectPayload = (payload: CreateSubjectPayload | UpdateSubjectPayload): SubjectPayload => ({
  name: payload.name.trim(),
});

export const getSubjects = async (): Promise<SubjectListResponse> => {
  const response = await adminApiClient.get<SubjectListResponse>('/subjects');
  return unwrap(response);
};

export const getSubjectById = async (id: number | string): Promise<SubjectResponse> => {
  const response = await adminApiClient.get<SubjectResponse>(`/subjects/${id}`);
  return unwrap(response);
};

export const createSubject = async (payload: CreateSubjectPayload): Promise<SubjectResponse> => {
  const response = await adminApiClient.post<SubjectResponse>('/subjects', normalizeSubjectPayload(payload));
  return unwrap(response);
};

export const updateSubject = async (
  id: number | string,
  payload: UpdateSubjectPayload,
): Promise<SubjectResponse> => {
  const response = await adminApiClient.put<SubjectResponse>(`/subjects/${id}`, normalizeSubjectPayload(payload));
  return unwrap(response);
};

export const deleteSubject = async (id: number | string): Promise<void> => {
  await adminApiClient.delete(`/subjects/${id}`);
};

export const subjectApi = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};

export default subjectApi;
