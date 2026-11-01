import { useState } from 'react';
import { AxiosError } from 'axios';
import { examApi } from '../api/examApi';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';
import type { StartSessionResponseDTO } from '../types/student.types';

interface UseStartExamSessionResult {
  startSession: (examId: number) => Promise<StartSessionResponseDTO | null>;
  starting: boolean;
  error: string;
}

export const useStartExamSession = (): UseStartExamSessionResult => {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const startSession = async (examId: number): Promise<StartSessionResponseDTO | null> => {
    if (starting) {
      return null;
    }

    setStarting(true);
    setError('');

    try {
      const response = await examApi.startSession(examId);
      return response;
    } catch (err) {
      const message = err instanceof AxiosError
        ? normalizeApiErrorMessage(err)
        : err instanceof Error
          ? err.message
          : 'Không thể bắt đầu kỳ thi ngay lúc này.';
      setError(message);
      return null;
    } finally {
      setStarting(false);
    }
  };

  return {
    startSession,
    starting,
    error,
  };
};
