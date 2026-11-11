/**
 * Factory của query key cho TanStack Query.
 * Không hardcode chuỗi ở nơi sử dụng — luôn gọi qua đây.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: { role?: string; keyword?: string }) => ['users', 'list', params ?? {}] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    list: ['subjects', 'list'] as const,
    detail: (id: number) => ['subjects', 'detail', id] as const,
    chapters: (subjectId: number) => ['subjects', 'chapters', subjectId] as const,
  },
  questions: {
    all: ['questions'] as const,
    list: (params: { page: number; size: number; subjectId?: number; chapterId?: number; keyword?: string }) =>
      ['questions', 'list', params] as const,
    detail: (id: number) => ['questions', 'detail', id] as const,
  },
  exams: {
    all: ['exams'] as const,
    list: ['exams', 'list'] as const,
    detail: (id: number) => ['exams', 'detail', id] as const,
    participants: (examId: number) => ['exams', 'participants', examId] as const,
  },
  sessions: {
    active: ['sessions', 'active'] as const,
    detail: (id: number) => ['sessions', 'detail', id] as const,
    questions: (id: number) => ['sessions', 'questions', id] as const,
    answers: (id: number) => ['sessions', 'answers', id] as const,
  },
  results: {
    me: ['results', 'me'] as const,
    session: (sessionId: number) => ['results', 'session', sessionId] as const,
    exam: (examId: number) => ['results', 'exam', examId] as const,
  },
  paperExams: {
    all: ['paper-exams'] as const,
    list: ['paper-exams', 'list'] as const,
    detail: (id: number) => ['paper-exams', 'detail', id] as const,
    answers: (id: number) => ['paper-exams', 'answers', id] as const,
    scanResults: (id: number) => ['paper-exams', 'scan-results', id] as const,
    scanResult: (scanResultId: number) => ['paper-exams', 'scan-result', scanResultId] as const,
  },
};
