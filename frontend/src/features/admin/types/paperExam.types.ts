export type PaperExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;

export interface PaperExamChapterConfigPayload {
  chapterId: number;
  questionCount: number;
}

export interface PaperExamCreatePayload {
  title: string;
  subjectId: number;
  durationMinutes: number;
  totalQuestions: number;
  chapterConfigs: PaperExamChapterConfigPayload[];
}

export interface PaperExamChapterConfig {
  id: number;
  chapterId: number;
  chapterName?: string | null;
  questionCount: number;
}

export interface PaperExamListItem {
  id: number;
  title: string;
  subjectId: number;
  subjectName?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  showAnswers?: boolean;
  status?: PaperExamStatus;
  createdById?: number | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  chapterConfigs?: PaperExamChapterConfig[];
}

export interface PaperExamDetail extends PaperExamListItem {
  chapterConfigs: PaperExamChapterConfig[];
}

export interface PaperExamAnswerItem {
  id: number;
  answerId?: number;
  orderIndex?: number;
  content: string;
  imageUrl?: string | null;
  isCorrect: boolean;
}

export interface PaperExamAnswerQuestion {
  id: number;
  questionId?: number;
  chapterId: number;
  chapterName?: string | null;
  orderIndex?: number;
  content: string;
  imageUrl?: string | null;
  answers: PaperExamAnswerItem[];
}

export interface PaperExamAnswerView {
  paperExamId: number;
  title: string;
  showAnswers?: boolean;
  questions: PaperExamAnswerQuestion[];
}

export interface PaperExamPreviewResponse {
  paperExamId?: number;
}

export interface PaperExamPdfMetaResponse {
  contentType?: string;
  fileName?: string;
}

export interface PaperExamScanSummary {
  status: PaperExamScanStatus;
  score?: number | null;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNeedsReview: number;
  totalMultiMarked: number;
}

export interface PaperExamScanHistoryItem extends PaperExamScanSummary {
  id: number;
  paperExamId: number;
  formVariant: number;
  actualQuestionCount: number;
  totalQuestions: number;
  imagePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type PaperExamScanStatus =
  | 'SUCCESS'
  | 'FAILED_TO_READ'
  | 'NEEDS_REVIEW'
  | 'TIMEOUT'
  | 'INVALID_IMAGE'
  | 'SERVICE_UNAVAILABLE'
  | string;

export type PaperExamScanQuestionStatus =
  | 'CORRECT'
  | 'WRONG'
  | 'EMPTY'
  | 'MULTI_MARKED'
  | 'NEEDS_REVIEW'
  | 'IGNORED'
  | string;

export interface PaperExamScanRequest {
  image: File;
  actualQuestionCount: number;
  formVariant?: number;
  debug?: boolean;
  scanMode?: 'AUTO' | 'MANUAL' | string;
}

export interface PaperExamScanQuestionResult {
  questionIndex: number;
  selectedOptions: string[];
  correctOptions: string[];
  status: PaperExamScanQuestionStatus;
  isEmpty: boolean;
  markedCount: number;
  confidence?: number | null;
  note?: string | null;
}

export interface PaperExamScanResponse {
  id: number;
  status: PaperExamScanStatus;
  paperExamId: number;
  formVariant: number;
  actualQuestionCount: number;
  totalQuestions: number;
  score?: number | null;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNeedsReview: number;
  totalMultiMarked: number;
  imagePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  questionResults: PaperExamScanQuestionResult[];
  rawVisionOutput?: string | null;
  errors: string[];
}

export type PaperExamScanListItem = PaperExamScanHistoryItem;
