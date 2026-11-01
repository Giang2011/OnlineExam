import type { AxiosResponse } from 'axios';
import adminApiClient from './adminApiClient';
import type {
  PaperExamAnswerView,
  PaperExamCreatePayload,
  PaperExamDetail,
  PaperExamListItem,
  PaperExamPdfMetaResponse,
  PaperExamScanListItem,
  PaperExamScanRequest,
  PaperExamScanResponse,
} from '../types';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';

const unwrap = <T>(response: AxiosResponse<T>): T => response.data;

const parseFilenameFromContentDisposition = (contentDisposition?: string | null): string | undefined => {
  if (!contentDisposition) {
    return undefined;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ''));
    } catch {
      return utf8Match[1].replace(/^"|"$/g, '');
    }
  }

  const basicMatch = contentDisposition.match(/filename=([^;]+)/i);

  if (basicMatch?.[1]) {
    return basicMatch[1].trim().replace(/^"|"$/g, '');
  }

  return undefined;
};

const getPdfMetaFromResponse = (response: AxiosResponse<Blob>): PaperExamPdfMetaResponse => ({
  contentType: response.headers['content-type'],
  fileName: parseFilenameFromContentDisposition(response.headers['content-disposition']),
});

const normalizeChapterConfigs = (chapterConfigs: PaperExamCreatePayload['chapterConfigs']) =>
  chapterConfigs.map((item) => ({
    chapterId: item.chapterId,
    questionCount: item.questionCount,
  }));

const normalizeCreatePayload = (payload: PaperExamCreatePayload): PaperExamCreatePayload => ({
  ...payload,
  title: payload.title.trim(),
  chapterConfigs: normalizeChapterConfigs(payload.chapterConfigs),
});

export const getPaperExams = async (): Promise<PaperExamListItem[]> => {
  const response = await adminApiClient.get<PaperExamListItem[]>('/paper-exams');
  return unwrap(response);
};

export const getPaperExamById = async (id: number | string): Promise<PaperExamDetail> => {
  const response = await adminApiClient.get<PaperExamDetail>(`/paper-exams/${id}`);
  return unwrap(response);
};

export const createPaperExam = async (payload: PaperExamCreatePayload): Promise<PaperExamDetail> => {
  const response = await adminApiClient.post<PaperExamDetail>('/paper-exams', normalizeCreatePayload(payload));
  return unwrap(response);
};

export const getPaperExamAnswers = async (id: number | string): Promise<PaperExamAnswerView> => {
  const response = await adminApiClient.get<PaperExamAnswerView>(`/paper-exams/${id}/answers`);
  return unwrap(response);
};

export const previewPaperExamPdf = async (
  id: number | string,
): Promise<{ blob: Blob; meta: PaperExamPdfMetaResponse }> => {
  const response = await adminApiClient.get<Blob>(`/paper-exams/${id}/pdf/preview`, {
    responseType: 'blob',
  });

  return {
    blob: unwrap(response),
    meta: getPdfMetaFromResponse(response),
  };
};

export const downloadPaperExamPdf = async (
  id: number | string,
): Promise<{ blob: Blob; meta: PaperExamPdfMetaResponse }> => {
  const response = await adminApiClient.get<Blob>(`/paper-exams/${id}/pdf`, {
    responseType: 'blob',
  });

  return {
    blob: unwrap(response),
    meta: getPdfMetaFromResponse(response),
  };
};

export const scanPaperExam = async (
  paperExamId: number | string,
  payload: PaperExamScanRequest,
): Promise<PaperExamScanResponse> => {
  const formData = new FormData();
  formData.append('image', payload.image);
  formData.append('formVariant', String(payload.formVariant ?? 75));
  formData.append('debug', String(payload.debug ?? false));
  formData.append('scanMode', payload.scanMode ?? 'AUTO');

  if (typeof payload.actualQuestionCount === 'number') {
    formData.append('actualQuestionCount', String(payload.actualQuestionCount));
  }

  const response = await adminApiClient.post<PaperExamScanResponse>(`/paper-exams/${paperExamId}/scan`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return unwrap(response);
};

export const getPaperExamScanResults = async (paperExamId: number | string): Promise<PaperExamScanListItem[]> => {
  const response = await adminApiClient.get<PaperExamScanListItem[]>(`/paper-exams/${paperExamId}/scan-results`);
  return unwrap(response);
};

export const getPaperExamScanResultById = async (scanResultId: number | string): Promise<PaperExamScanResponse> => {
  const response = await adminApiClient.get<PaperExamScanResponse>(`/paper-exams/scan-results/${scanResultId}`);
  return unwrap(response);
};

export const deletePaperExam = async (id: number | string): Promise<void> => {
  await adminApiClient.delete(`/paper-exams/${id}`);
};

export const paperExamApi = {
  getPaperExams,
  getPaperExamById,
  createPaperExam,
  getPaperExamAnswers,
  previewPaperExamPdf,
  downloadPaperExamPdf,
  scanPaperExam,
  getPaperExamScanResults,
  getPaperExamScanResultById,
  deletePaperExam,
};

export default paperExamApi;
