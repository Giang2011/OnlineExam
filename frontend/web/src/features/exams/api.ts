import { api } from '@/shared/lib/api-client';
import type { Exam, ExamParticipant, ExamRequest } from '@/features/exams/types';

export const examsApi = {
  list: () => api.get<Exam[]>('/exams'),

  detail: (id: number) => api.get<Exam>(`/exams/${id}`),

  create: (payload: ExamRequest) => api.post<Exam>('/exams', payload),

  update: (id: number, payload: ExamRequest) => api.put<Exam>(`/exams/${id}`, payload),

  remove: (id: number) => api.delete<void>(`/exams/${id}`),

  listParticipants: (examId: number) => api.get<ExamParticipant[]>(`/exams/${examId}/participants`),

  addParticipant: (examId: number, userId: number) =>
    api.post<void>(`/exams/${examId}/participants`, { userId }),

  removeParticipant: (examId: number, userId: number) =>
    api.delete<void>(`/exams/${examId}/participants/${userId}`),
};
