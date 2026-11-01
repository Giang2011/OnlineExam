export interface ExamResultItem {
  id: number;
  examSessionId: number;
  studentName: string;
  studentId: string;
  score: number;
  totalCorrect: number;
  submittedAt: string;
}

export interface ExamReportStatistics {
  average: number;
  highest: number;
  lowest: number;
  totalSubmitted: number;
  distribution: {
    from0To2: number;
    from2To4: number;
    from4To6: number;
    from6To8: number;
    from8To10: number;
  };
}

export interface ExamReportData {
  examId: number;
  examTitle: string;
  statistics: ExamReportStatistics;
  results: ExamResultItem[];
}

export type ExamResultsResponse = ExamResultItem[];
