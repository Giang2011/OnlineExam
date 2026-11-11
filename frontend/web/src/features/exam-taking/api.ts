import { api } from '@/shared/lib/api-client';
import type {
  ActiveSession,
  DraftAnswer,
  DraftAnswerResponse,
  ExamSession,
  SessionDetail,
  SessionQuestion,
} from '@/features/exam-taking/types';

export const sessionsApi = {
  /** Bắt đầu hoặc khôi phục phiên thi. */
  start: (examId: number) => api.post<ExamSession>(`/sessions/start/${examId}`),

  /** 204 nếu không có phiên đang chạy. */
  active: () => api.get<ActiveSession | null>('/sessions/active'),

  detail: (sessionId: number) => api.get<SessionDetail>(`/sessions/${sessionId}`),

  /** Đề thi — KHÔNG có isCorrect. */
  questions: (sessionId: number) => api.get<SessionQuestion[]>(`/sessions/${sessionId}/questions`),

  getAnswers: (sessionId: number) => api.get<DraftAnswerResponse>(`/sessions/${sessionId}/answers`),

  /** Autosave đáp án. */
  saveAnswers: (sessionId: number, answers: DraftAnswer[]) =>
    api.put<DraftAnswerResponse>(`/sessions/${sessionId}/answers`, { answers }),

  /** Nộp bài — response kèm score / totalCorrect / totalQuestions. */
  submit: (sessionId: number, answers: DraftAnswer[]) =>
    api.post<ExamSession>(`/sessions/${sessionId}/submit`, { answers }),
};
