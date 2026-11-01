import { useCallback, useEffect, useState } from 'react';
import { resultApi } from '../api/resultApi';
import type { MyResultDTO } from '../types/student.types';

interface UseMyResultsResult {
  results: MyResultDTO[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useMyResults = (): UseMyResultsResult => {
  const [results, setResults] = useState<MyResultDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await resultApi.getMyResults();
      setResults(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải lịch sử thi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    results,
    loading,
    error,
    refetch,
  };
};
