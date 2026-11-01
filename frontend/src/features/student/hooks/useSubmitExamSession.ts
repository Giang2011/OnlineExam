import { useState } from 'react';
import { sessionApi } from '../api/sessionApi';
import type { SubmitSessionRequestDTO, SubmitSessionResponseDTO } from '../types/student.types';

interface UseSubmitExamSessionResult {
  submitSession: (sessionId: number, payload: SubmitSessionRequestDTO) => Promise<SubmitSessionResponseDTO | null>;
  submitting: boolean;
  error: string;
}

export const useSubmitExamSession = (): UseSubmitExamSessionResult => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitSession = async (
    sessionId: number,
    payload: SubmitSessionRequestDTO,
  ): Promise<SubmitSessionResponseDTO | null> => {
    if (submitting) {
      return null;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await sessionApi.submitSession(sessionId, payload);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể nộp bài lúc này.';
      setError(message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitSession,
    submitting,
    error,
  };
};
