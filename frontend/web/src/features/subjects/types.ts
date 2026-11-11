export interface Chapter {
  id: number;
  subjectId: number;
  name: string;
  questionCount: number;
}

export interface Subject {
  id: number;
  name: string;
  chapters: Chapter[];
}

export interface SubjectRequest {
  name: string;
}

export interface ChapterRequest {
  name: string;
}
