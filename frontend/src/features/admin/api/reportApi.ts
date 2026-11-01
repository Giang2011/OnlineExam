import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';

export interface ExamResultItem {
  id: number;
  examSessionId: number;
  studentName: string;
  studentId: string;
  score: number;
  totalCorrect: number;
  submittedAt: string;
}

export interface ExamReportResponse {
  examId: number;
  examTitle: string;
  statistics: {
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
  };
  results: ExamResultItem[];
}

export type ExamResultsResponse = ExamResultItem[];

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

export const getExamResults = async (examId: number | string): Promise<ExamReportResponse> => {
  const response = await adminApiClient.get<ExamReportResponse>(`/results/exam/${examId}`, {
    suppressErrorToast: true,
  });

  const payload = unwrap(response);
  return {
    ...payload,
    results: Array.isArray(payload.results) ? payload.results : [],
  };
};

export const reportApi = {
  getExamResults,
};

export default reportApi;
