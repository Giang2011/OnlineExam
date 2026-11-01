import { examApi } from './examApi';
import { resultApi } from './resultApi';
import { sessionApi } from './sessionApi';

export const studentApi = {
  ...examApi,
  ...sessionApi,
  ...resultApi,
};

export type { ExamSummaryDTO as ExamResponseDTO } from '../types/student.types';
