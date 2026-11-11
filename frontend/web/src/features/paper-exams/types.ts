export interface PaperExamChapterConfig {
  id: number;
  chapterId: number;
  chapterName: string;
  questionCount: number;
}

export interface PaperExam {
  id: number;
  title: string;
  subjectId: number;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  omrQuestionsPerPage: number;
  omrChoicesPerQ: number;
  omrPageCount: number;
  showAnswers: boolean;
  status: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  chapterConfigs: PaperExamChapterConfig[];
}

export interface PaperExamRequest {
  title: string;
  subjectId: number;
  durationMinutes: number;
  totalQuestions: number;
  chapterConfigs: { chapterId: number; questionCount: number }[];
}

export interface PaperExamAnswer {
  /** ID snapshot đáp án trong đề giấy. */
  id: number;
  /** ID đáp án gốc trong ngân hàng câu hỏi — định danh ổn định. */
  answerId: number;
  orderIndex: number;
  content: string;
  imageUrl: string | null;
  isCorrect: boolean;
}

export interface PaperExamQuestion {
  id: number;
  questionId: number;
  chapterId: number;
  chapterName: string;
  orderIndex: number;
  content: string;
  imageUrl: string | null;
  answers: PaperExamAnswer[];
}

export interface PaperExamAnswers {
  paperExamId: number;
  title: string;
  showAnswers: boolean;
  questions: PaperExamQuestion[];
}

export type ScanQuestionStatus =
  | 'CORRECT'
  | 'WRONG'
  | 'EMPTY'
  | 'MULTI_MARKED'
  | 'NEEDS_REVIEW'
  | 'IGNORED';

export type ScanStatus =
  | 'SUCCESS'
  | 'FAILED_TO_READ'
  | 'NEEDS_REVIEW'
  | 'TIMEOUT'
  | 'INVALID_IMAGE'
  | 'SERVICE_UNAVAILABLE';

export interface ScanQuestionResult {
  questionIndex: number;
  selectedOptions: string[];
  correctOptions: string[];
  status: ScanQuestionStatus;
  isEmpty: boolean;
  markedCount: number;
  confidence: number;
  note: string | null;
}

export interface ScanResult {
  id: number;
  status: ScanStatus;
  paperExamId: number;
  studentId: string | null;
  actualQuestionCount: number;
  totalQuestions: number;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNeedsReview: number;
  totalMultiMarked: number;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  questionResults: ScanQuestionResult[];
  rawVisionOutput: string | null;
  errors: string[];
}
