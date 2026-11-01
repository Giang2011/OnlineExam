import studentApiClient from './studentApiClient';
import type {
  SessionQuestionDTO,
  SubmitSessionRequestDTO,
  SubmitSessionResponseDTO,
} from '../types/student.types';

export const sessionApi = {
  async getSessionQuestions(sessionId: number): Promise<SessionQuestionDTO[]> {
    const response = await studentApiClient.get<SessionQuestionDTO[]>(`/sessions/${sessionId}/questions`);
    return response.data;
  },

  async submitSession(sessionId: number, payload: SubmitSessionRequestDTO): Promise<SubmitSessionResponseDTO> {
    const response = await studentApiClient.post<SubmitSessionResponseDTO>(`/sessions/${sessionId}/submit`, payload);
    return response.data;
  },
};
