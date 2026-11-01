import { useCallback, useEffect, useState } from 'react';
import { resultApi } from '../api/resultApi';
import type { SessionResultDTO } from '../types/student.types';

interface UseSessionResultResult {
  result: SessionResultDTO | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useSessionResult = (sessionId?: number): UseSessionResultResult => {
  const [result, setResult] = useState<SessionResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!sessionId || Number.isNaN(sessionId)) {
      setLoading(false);
      setError('Mã phiên thi không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await resultApi.getSessionResult(sessionId);
      setResult(data);
    } catch (err) {
      setResult(null);
      const message = err instanceof Error ? err.message : 'Không thể tải kết quả phiên thi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    result,
    loading,
    error,
    refetch,
  };
};
