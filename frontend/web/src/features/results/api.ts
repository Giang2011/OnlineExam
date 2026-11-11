import { api } from '@/shared/lib/api-client';
import type { ExamResults, Result } from '@/features/results/types';

export const resultsApi = {
  /** Lịch sử thi của học sinh đang đăng nhập. */
  me: () => api.get<Result[]>('/results/me'),

  /** Kết quả một phiên thi — STUDENT chỉ xem được phiên của mình. */
  session: (sessionId: number) => api.get<Result>(`/results/session/${sessionId}`),

  /** Bảng điểm kỳ thi — trả object { statistics, results[] }. */
  exam: (examId: number) => api.get<ExamResults>(`/results/exam/${examId}`),
};
