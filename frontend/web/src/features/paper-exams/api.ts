import { api, apiDownload } from '@/shared/lib/api-client';
import type {
  PaperExam,
  PaperExamAnswers,
  PaperExamRequest,
  ScanResult,
} from '@/features/paper-exams/types';

export const paperExamsApi = {
  list: () => api.get<PaperExam[]>('/paper-exams'),

  detail: (id: number) => api.get<PaperExam>(`/paper-exams/${id}`),

  create: (payload: PaperExamRequest) => api.post<PaperExam>('/paper-exams', payload),

  remove: (id: number) => api.delete<void>(`/paper-exams/${id}`),

  answers: (id: number) => api.get<PaperExamAnswers>(`/paper-exams/${id}/answers`),

  previewPdf: (id: number) => apiDownload(`/paper-exams/${id}/pdf/preview`),

  downloadPdf: (id: number) => apiDownload(`/paper-exams/${id}/pdf`),

  previewOmrSheet: (id: number, studentId?: string) =>
    apiDownload(
      `/paper-exams/${id}/omr-sheet/preview${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`,
    ),

  downloadOmrSheet: (id: number, studentId?: string) =>
    apiDownload(
      `/paper-exams/${id}/omr-sheet${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`,
    ),

  /**
   * Upload ảnh scan. Mỗi ảnh = 1 trang phiếu.
   * Part tên đúng là `images` (số nhiều) — không có part `meta`.
   */
  scan: (id: number, images: File[], options?: { actualQuestionCount?: number; debug?: boolean; scanMode?: string }) => {
    const form = new FormData();
    for (const image of images) {
      form.append('images', image);
    }
    if (options?.actualQuestionCount !== undefined) {
      form.append('actualQuestionCount', String(options.actualQuestionCount));
    }
    form.append('debug', String(options?.debug ?? false));
    form.append('scanMode', options?.scanMode ?? 'AUTO');
    return api.post<ScanResult>(`/paper-exams/${id}/scan`, form);
  },

  scanResults: (id: number) => api.get<ScanResult[]>(`/paper-exams/${id}/scan-results`),

  scanResult: (scanResultId: number) => api.get<ScanResult>(`/paper-exams/scan-results/${scanResultId}`),
};
