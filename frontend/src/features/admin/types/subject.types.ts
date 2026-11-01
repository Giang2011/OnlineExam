export interface SubjectChapter {
  id: number;
  subjectId: number;
  name: string;
  questionCount: number;
}

export interface Subject {
  id: number;
  name: string;
  chapters: SubjectChapter[];
}

export interface SubjectPayload {
  name: string;
}
