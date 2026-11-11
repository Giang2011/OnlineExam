import { api } from '@/shared/lib/api-client';
import type { Page } from '@/shared/types/common';
import type { Question, QuestionRequest } from '@/features/questions/types';

export interface QuestionListParams {
  page: number;
  size: number;
  subjectId?: number;
  chapterId?: number;
  keyword?: string;
}

/** Backend trả Spring Page object — đọc ở `content`. */
export const questionsApi = {
  list: (params: QuestionListParams) => {
    const search = new URLSearchParams();
    search.set('page', String(params.page));
    search.set('size', String(params.size));
    if (params.subjectId) search.set('subjectId', String(params.subjectId));
    if (params.chapterId) search.set('chapterId', String(params.chapterId));
    if (params.keyword) search.set('keyword', params.keyword);
    return api.get<Page<Question>>(`/questions?${search.toString()}`);
  },

  detail: (id: number) => api.get<Question>(`/questions/${id}`),

  create: (data: QuestionRequest, questionImage: File | null, answerImages: (File | null)[]) => {
    const form = new FormData();
    form.append('data', JSON.stringify(data));
    if (questionImage) form.append('questionImage', questionImage);
    for (const image of answerImages) {
      if (image) form.append('answerImages', image);
    }
    // KHÔNG set Content-Type — browser tự sinh boundary.
    return api.post<Question>('/questions', form);
  },

  update: (
    id: number,
    data: QuestionRequest,
    questionImage: File | null,
    answerImages: (File | null)[],
  ) => {
    const form = new FormData();
    form.append('data', JSON.stringify(data));
    if (questionImage) form.append('questionImage', questionImage);
    for (const image of answerImages) {
      if (image) form.append('answerImages', image);
    }
    return api.put<Question>(`/questions/${id}`, form);
  },

  remove: (id: number) => api.delete<void>(`/questions/${id}`),
};
