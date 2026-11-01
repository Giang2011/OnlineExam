import studentApiClient from './studentApiClient';
import type { ExamDetailDTO, ExamSummaryDTO, StartSessionResponseDTO } from '../types/student.types';

export const examApi = {
  async getExams(): Promise<ExamSummaryDTO[]> {
    const response = await studentApiClient.get<ExamSummaryDTO[]>('/exams');
    return response.data;
  },

  async getExamById(id: number): Promise<ExamDetailDTO> {
    const response = await studentApiClient.get<ExamDetailDTO>(`/exams/${id}`);
    return response.data;
  },

  async startSession(examId: number): Promise<StartSessionResponseDTO> {
    const response = await studentApiClient.post<StartSessionResponseDTO>(`/sessions/start/${examId}`);
    return response.data;
  },
};
