export type ExamStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface ChapterConfig {
  chapterId: number;
  questionCount: number;
}

export interface Exam {
  id: number;
  title: string;
  subjectId: number;
  subjectName: string;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  maxAttempts: number;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  participantCount: number;
}

export interface ExamRequest {
  title: string;
  subjectId: number;
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  maxAttempts: number;
  chapterConfigs: ChapterConfig[];
  startTime: string;
  endTime: string;
}

/** Backend trả UserResponseDTO cho danh sách thí sinh — dùng `id` làm userId. */
export interface ExamParticipant {
  id: number;
  username: string;
  name: string;
  studentId: string | null;
  role: 'STUDENT';
}
