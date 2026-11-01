import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';

export interface Participant {
  id: number;
  userId: number;
  username: string;
  name: string;
  studentId: string;
}

export interface AddParticipantPayload {
  userId: number;
}

export type ParticipantListResponse = Participant[];

type ParticipantApiResponse = Omit<Participant, 'userId'> & { userId?: number };

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const participantsUrl = (examId: number | string, userId?: number | string): string =>
  userId === undefined ? `/exams/${examId}/participants` : `/exams/${examId}/participants/${userId}`;

export const getParticipants = async (examId: number | string): Promise<ParticipantListResponse> => {
  const response = await adminApiClient.get<ParticipantApiResponse[]>(participantsUrl(examId));
  return unwrap(response).map((item) => ({
    ...item,
    userId: item.userId ?? item.id,
  }));
};

export const addParticipant = async (
  examId: number | string,
  payload: AddParticipantPayload,
): Promise<void> => {
  await adminApiClient.post(participantsUrl(examId), payload);
};

export const removeParticipant = async (examId: number | string, userId: number | string): Promise<void> => {
  await adminApiClient.delete(participantsUrl(examId, userId));
};

export const participantApi = {
  getParticipants,
  addParticipant,
  removeParticipant,
};

export default participantApi;
