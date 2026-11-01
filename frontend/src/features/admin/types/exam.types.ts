export interface Exam {
  id: number;
  name: string;
  subjectId: number;
  duration: number;
}

export interface ExamPayload {
  name: string;
  subjectId: number;
  duration: number;
}
