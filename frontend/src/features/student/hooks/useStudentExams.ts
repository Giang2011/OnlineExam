import { useCallback, useEffect, useState } from 'react';
import { examApi } from '../api/examApi';
import type { ExamSummaryDTO } from '../types/student.types';

interface UseStudentExamsResult {
  exams: ExamSummaryDTO[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useStudentExams = (): UseStudentExamsResult => {
  const [exams, setExams] = useState<ExamSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await examApi.getExams();
      setExams(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách kỳ thi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    exams,
    loading,
    error,
    refetch,
  };
};
