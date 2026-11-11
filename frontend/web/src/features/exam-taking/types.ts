export type SessionStatus = 'DOING' | 'SUBMITTED';

export type SubmitSource = 'MANUAL' | 'TIMEOUT' | 'GRACE' | 'RESUME';

export interface ExamSession {
  id: number;
  examId: number;
  examTitle: string;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  attemptNo: number;
  deadlineAt: string;
  serverTime: string;
  remainingSeconds: number;
  submitSource: SubmitSource | null;
  /** Chỉ có trong response của POST /sessions/{id}/submit. */
  score?: number;
  totalCorrect?: number;
  totalQuestions?: number;
}

export interface ActiveSession {
  sessionId: number;
  examId: number;
  examTitle: string;
  attemptNo: number;
  status: SessionStatus;
  startTime: string;
  deadlineAt: string;
  serverTime: string;
  remainingSeconds: number;
}

export interface SessionDetail {
  sessionId: number;
  examId: number;
  examTitle: string;
  attemptNo: number;
  maxAttempts: number;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  deadlineAt: string;
  serverTime: string;
  remainingSeconds: number;
  submitSource: SubmitSource | null;
  attemptsExhausted: boolean;
}

export interface SessionQuestionAnswer {
  answerId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
}

export interface SessionQuestion {
  variantQuestionId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
  isMultipleChoice: boolean;
  answers: SessionQuestionAnswer[];
}

export interface DraftAnswer {
  variantQuestionId: number;
  selectedAnswerIds: number[];
}

export interface DraftAnswerResponse {
  sessionId: number;
  attemptNo: number;
  answers: DraftAnswer[];
}
