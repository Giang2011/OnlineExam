import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';
import type { Chapter, ChapterPayload } from '../types';

export type ChapterResponse = Chapter;
export type ChapterListResponse = Chapter[];
export type CreateChapterPayload = ChapterPayload;
export type UpdateChapterPayload = ChapterPayload;

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const normalizeChapterPayload = (payload: CreateChapterPayload | UpdateChapterPayload): ChapterPayload => ({
  name: payload.name.trim(),
});

const chaptersUrl = (subjectId: number | string, chapterId?: number | string): string =>
  chapterId === undefined
    ? `/subjects/${subjectId}/chapters`
    : `/subjects/${subjectId}/chapters/${chapterId}`;

export const getChapters = async (subjectId: number | string): Promise<ChapterListResponse> => {
  const response = await adminApiClient.get<ChapterListResponse>(chaptersUrl(subjectId));
  return unwrap(response);
};

export const createChapter = async (
  subjectId: number | string,
  payload: CreateChapterPayload,
): Promise<ChapterResponse> => {
  const response = await adminApiClient.post<ChapterResponse>(chaptersUrl(subjectId), normalizeChapterPayload(payload));
  return unwrap(response);
};

export const updateChapter = async (
  subjectId: number | string,
  id: number | string,
  payload: UpdateChapterPayload,
): Promise<ChapterResponse> => {
  const response = await adminApiClient.put<ChapterResponse>(chaptersUrl(subjectId, id), normalizeChapterPayload(payload));
  return unwrap(response);
};

export const deleteChapter = async (subjectId: number | string, id: number | string): Promise<void> => {
  await adminApiClient.delete(chaptersUrl(subjectId, id));
};

export const chapterApi = {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
};

export default chapterApi;
