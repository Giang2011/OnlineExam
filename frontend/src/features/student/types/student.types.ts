export type ExamStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | string;
export type SessionStatus = 'DOING' | 'SUBMITTED';

export interface ExamChapterConfigDTO {
  chapterId: number;
  chapterName?: string;
  questionCount: number;
}

export interface ExamSummaryDTO {
  id: number;
  title: string;
  subjectId: number;
  subjectName?: string;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  startTime: string | null;
  endTime: string | null;
  status?: ExamStatus;
}

export interface ExamDetailDTO extends ExamSummaryDTO {
  chapterConfigs?: ExamChapterConfigDTO[];
  description?: string;
}

export interface StartSessionResponseDTO {
  id: number;
  examId: number;
  examTitle?: string;
  variantId: number;
  startTime: string;
  status: SessionStatus;
  endTime?: string | null;
}

export interface SessionQuestionAnswerDTO {
  answerId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
}

export interface SessionQuestionDTO {
  variantQuestionId: number;
  content: string;
  imageUrl: string | null;
  orderIndex: number;
  isMultipleChoice: boolean;
  answers: SessionQuestionAnswerDTO[];
}

export interface SubmitAnswerDTO {
  variantQuestionId: number;
  selectedAnswerIds: number[];
}

export interface SubmitSessionRequestDTO {
  answers: SubmitAnswerDTO[];
}

export interface SubmitSessionResponseDTO {
  id: number;
  examSessionId: number;
  score: number;
  totalCorrect: number;
  totalQuestions?: number;
  submittedAt: string;
}

export interface MyResultDTO {
  id: number;
  examSessionId: number;
  examTitle: string;
  score: number;
  totalCorrect: number;
  totalQuestions?: number;
  submittedAt: string;
}

export interface SessionResultDTO {
  id: number;
  examSessionId: number;
  examTitle: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  submittedAt: string;
  studentName?: string;
  studentId?: string;
}
