import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';

export interface ChapterConfigPayload {
  chapterId: number;
  questionCount: number;
}

export interface ExamRequestPayload {
  title: string;
  subjectId: number;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  chapterConfigs: ChapterConfigPayload[];
  startTime: string;
  endTime: string;
}

export type ExamStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | string;

export interface ExamResponse {
  id: number;
  title: string;
  subjectId: number;
  subjectName?: string;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  chapterConfigs?: ChapterConfigPayload[];
  startTime: string | null;
  endTime: string | null;
  status?: ExamStatus;
  participantCount?: number;
}

export type ExamListResponse = ExamResponse[];
export type CreateExamPayload = ExamRequestPayload;
export type UpdateExamPayload = ExamRequestPayload;

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const normalizeExamPayload = (payload: CreateExamPayload | UpdateExamPayload): ExamRequestPayload => ({
  ...payload,
  title: payload.title.trim(),
  chapterConfigs: payload.chapterConfigs.map((item) => ({
    chapterId: item.chapterId,
    questionCount: item.questionCount,
  })),
  startTime: payload.startTime.trim(),
  endTime: payload.endTime.trim(),
});

export const getExams = async (): Promise<ExamListResponse> => {
  const response = await adminApiClient.get<ExamListResponse>('/exams');
  return unwrap(response);
};

export const getExamById = async (id: number | string): Promise<ExamResponse> => {
  const response = await adminApiClient.get<ExamResponse>(`/exams/${id}`);
  return unwrap(response);
};

export const createExam = async (payload: CreateExamPayload): Promise<ExamResponse> => {
  const response = await adminApiClient.post<ExamResponse>('/exams', normalizeExamPayload(payload));
  return unwrap(response);
};

export const updateExam = async (id: number | string, payload: UpdateExamPayload): Promise<ExamResponse> => {
  const response = await adminApiClient.put<ExamResponse>(`/exams/${id}`, normalizeExamPayload(payload));
  return unwrap(response);
};

export const deleteExam = async (id: number | string): Promise<void> => {
  await adminApiClient.delete(`/exams/${id}`);
};

export const examApi = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
};

export default examApi;
