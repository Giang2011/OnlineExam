export interface QuestionAnswer {
  id: number;
  content: string;
  imageUrl: string | null;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  content: string;
  imageUrl: string | null;
  subjectId: number;
  subjectName: string;
  chapterId: number;
  chapterName: string;
  createdAt: string;
  answers: QuestionAnswer[];
}

export interface QuestionAnswerRequest {
  content: string;
  isCorrect: boolean;
  imageRemoved?: boolean;
}

export interface QuestionRequest {
  content: string;
  subjectId: number;
  chapterId: number;
  questionImageRemoved?: boolean;
  answers: QuestionAnswerRequest[];
}
