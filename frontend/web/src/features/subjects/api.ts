import { api } from '@/shared/lib/api-client';
import type { Chapter, ChapterRequest, Subject, SubjectRequest } from '@/features/subjects/types';

export const subjectsApi = {
  list: () => api.get<Subject[]>('/subjects'),

  detail: (id: number) => api.get<Subject>(`/subjects/${id}`),

  create: (payload: SubjectRequest) => api.post<Subject>('/subjects', payload),

  update: (id: number, payload: SubjectRequest) => api.put<Subject>(`/subjects/${id}`, payload),

  remove: (id: number) => api.delete<void>(`/subjects/${id}`),

  listChapters: (subjectId: number) => api.get<Chapter[]>(`/subjects/${subjectId}/chapters`),

  createChapter: (subjectId: number, payload: ChapterRequest) =>
    api.post<Chapter>(`/subjects/${subjectId}/chapters`, payload),

  updateChapter: (subjectId: number, chapterId: number, payload: ChapterRequest) =>
    api.put<Chapter>(`/subjects/${subjectId}/chapters/${chapterId}`, payload),

  removeChapter: (subjectId: number, chapterId: number) =>
    api.delete<void>(`/subjects/${subjectId}/chapters/${chapterId}`),
};
