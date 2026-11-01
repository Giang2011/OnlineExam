import studentApiClient from './studentApiClient';
import type { MyResultDTO, SessionResultDTO } from '../types/student.types';

export const resultApi = {
  async getMyResults(): Promise<MyResultDTO[]> {
    const response = await studentApiClient.get<MyResultDTO[]>('/results/me');
    return response.data;
  },

  async getSessionResult(sessionId: number): Promise<SessionResultDTO> {
    const response = await studentApiClient.get<SessionResultDTO>(`/results/session/${sessionId}`);
    return response.data;
  },
};
