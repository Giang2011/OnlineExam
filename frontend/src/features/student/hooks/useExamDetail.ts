import { useCallback, useEffect, useState } from 'react';
import { examApi } from '../api/examApi';
import type { ExamDetailDTO } from '../types/student.types';

interface UseExamDetailResult {
  exam: ExamDetailDTO | null;
  loading: boolean;
  error: string;
  notFound: boolean;
  refetch: () => Promise<void>;
}

export const useExamDetail = (examId?: number): UseExamDetailResult => {
  const [exam, setExam] = useState<ExamDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!examId || Number.isNaN(examId)) {
      setLoading(false);
      setError('Mã kỳ thi không hợp lệ.');
      setNotFound(true);
      return;
    }

    setLoading(true);
    setError('');
    setNotFound(false);

    try {
      const data = await examApi.getExamById(examId);
      setExam(data);
    } catch (err: any) {
      setExam(null);
      if (err?.response?.status === 404) {
        setNotFound(true);
      }
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết kỳ thi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { exam, loading, error, notFound, refetch };
};
