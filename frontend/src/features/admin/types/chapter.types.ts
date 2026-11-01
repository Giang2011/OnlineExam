export interface Chapter {
  id: number;
  subjectId: number;
  name: string;
  questionCount: number;
}

export interface ChapterPayload {
  name: string;
}
