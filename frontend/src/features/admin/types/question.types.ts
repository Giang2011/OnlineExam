export interface QuestionAnswer {
  id?: number;
  content: string;
  isCorrect: boolean;
  imageUrl?: string | null;
}

export interface Question {
  id: number;
  subjectId: number;
  chapterId: number;
  content: string;
  imageUrl?: string | null;
  answers?: QuestionAnswer[];
  explanation?: string | null;
  subjectName?: string | null;
  chapterName?: string | null;
}

export interface QuestionPayload {
  subjectId: number;
  chapterId: number;
  content: string;
  explanation?: string;
}
