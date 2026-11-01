import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';
import type { Question } from '../types';

export interface QuestionAnswerPayload {
  content: string;
  isCorrect: boolean;
  imageRemoved?: boolean;
}

export interface QuestionRequestPayload {
  content: string;
  subjectId: number;
  chapterId: number;
  questionImageRemoved?: boolean;
  answers: QuestionAnswerPayload[];
}

export interface QuestionQueryParams {
  subjectId?: number;
  chapterId?: number;
  page?: number;
  size?: number;
}

export interface QuestionFormDataInput {
  data: QuestionRequestPayload;
  questionImage?: File | null;
  answerImages?: Array<File | null | undefined>;
}

export type QuestionResponse = Question;
export type QuestionListResponse = Question[];

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const normalizeRequestPayload = (payload: QuestionRequestPayload): QuestionRequestPayload => ({
  ...payload,
  content: payload.content.trim(),
  questionImageRemoved: Boolean(payload.questionImageRemoved),
  answers: payload.answers.map((answer) => ({
    ...answer,
    content: answer.content.trim(),
    isCorrect: answer.isCorrect,
    imageRemoved: Boolean(answer.imageRemoved),
  })),
});

const buildQuestionFormData = (input: QuestionFormDataInput): FormData => {
  const formData = new FormData();
  const normalizedData = normalizeRequestPayload(input.data);

  formData.append('data', JSON.stringify(normalizedData));

  if (input.questionImage) {
    formData.append('questionImage', input.questionImage);
  }

  if (input.answerImages?.length) {
    input.answerImages.forEach((file, index) => {
      if (file) {
        formData.append('answerImages', file);
        return;
      }

      // Giữ đúng thứ tự answer ↔ image bằng placeholder rỗng.
      // Backend dùng vị trí này để biết answer nào không có ảnh hoặc cần xoá ảnh cũ.
      formData.append('answerImages', new Blob(), `empty-${index}`);
    });
  }

  return formData;
};

export const getQuestions = async (params: QuestionQueryParams = {}): Promise<QuestionListResponse> => {
  const response = await adminApiClient.get<QuestionListResponse>('/questions', { params });
  return unwrap(response);
};

export const getQuestionById = async (id: number | string): Promise<QuestionResponse> => {
  const response = await adminApiClient.get<QuestionResponse>(`/questions/${id}`);
  return unwrap(response);
};

export const createQuestion = async (input: QuestionFormDataInput): Promise<QuestionResponse> => {
  const formData = buildQuestionFormData(input);
  const response = await adminApiClient.post<QuestionResponse>('/questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return unwrap(response);
};

export const updateQuestion = async (id: number | string, input: QuestionFormDataInput): Promise<QuestionResponse> => {
  const formData = buildQuestionFormData(input);
  const response = await adminApiClient.put<QuestionResponse>(`/questions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return unwrap(response);
};

export const deleteQuestion = async (id: number | string): Promise<void> => {
  await adminApiClient.delete(`/questions/${id}`);
};

export const questionApi = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};

export default questionApi;
