import { useCallback, useState } from 'react';
import { AxiosError } from 'axios';
import { getExamResults } from '../api/reportApi';
import type { ExamReportStatistics, ExamResultItem } from '../types';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminReportsResult {
  results: ExamResultItem[];
  loading: boolean;
  error: string | null;
  selectedExamId: number | null;
  statistics: ExamReportStatistics | null;
  refetch: () => Promise<void>;
  selectExam: (examId: number | string | null) => Promise<ExamResultItem[] | null>;
  clearSelection: () => void;
}

export const useAdminReports = (): UseAdminReportsResult => {
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<ExamReportStatistics | null>(null);

  const loadExamResults = useCallback(async (examId: number | string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getExamResults(examId);
      setResults(Array.isArray(data.results) ? data.results : []);
      setStatistics(data.statistics ?? null);
      setSelectedExamId(Number(examId));
      return Array.isArray(data.results) ? data.results : [];
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải bảng điểm kỳ thi.');
      }
      setStatistics(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectExam = useCallback(
    async (examId: number | string | null) => {
      if (examId === null) {
        setSelectedExamId(null);
        setResults([]);
        setStatistics(null);
        setError(null);
        return [];
      }

      return loadExamResults(examId);
    },
    [loadExamResults],
  );

  const refetch = useCallback(async () => {
    if (selectedExamId === null) {
      setResults([]);
      setStatistics(null);
      return;
    }

    await loadExamResults(selectedExamId);
  }, [loadExamResults, selectedExamId]);

  const clearSelection = useCallback(() => {
    setSelectedExamId(null);
    setResults([]);
    setStatistics(null);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    selectedExamId,
    statistics,
    refetch,
    selectExam,
    clearSelection,
  };
};

export default useAdminReports;
