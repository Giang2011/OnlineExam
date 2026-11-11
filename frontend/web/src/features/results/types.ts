export interface Result {
  id: number;
  rank: number | null;
  examSessionId: number;
  examTitle: string;
  studentName: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface ScoreDistribution {
  from0To2: number;
  from2To4: number;
  from4To6: number;
  from6To8: number;
  from8To10: number;
}

export interface ExamStatistics {
  average: number;
  highest: number;
  lowest: number;
  totalSubmitted: number;
  distribution: ScoreDistribution;
}

export interface ExamResults {
  examId: number;
  examTitle: string;
  statistics: ExamStatistics;
  results: Result[];
}
