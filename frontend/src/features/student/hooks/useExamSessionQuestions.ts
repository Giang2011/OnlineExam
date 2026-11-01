import { useCallback, useEffect, useMemo, useState } from 'react';
import { sessionApi } from '../api/sessionApi';
import type { SessionQuestionDTO } from '../types/student.types';

type AnswersByQuestion = Record<number, number[]>;

interface UseExamSessionQuestionsResult {
  questions: SessionQuestionDTO[];
  loading: boolean;
  error: string;
  answersByQuestion: AnswersByQuestion;
  setAnswersForQuestion: (variantQuestionId: number, answerIds: number[]) => void;
  toggleAnswer: (variantQuestionId: number, answerId: number, multiSelect: boolean) => void;
  refetch: () => Promise<void>;
}

export const useExamSessionQuestions = (sessionId?: number): UseExamSessionQuestionsResult => {
  const [questions, setQuestions] = useState<SessionQuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answersByQuestion, setAnswersByQuestion] = useState<AnswersByQuestion>({});

  const refetch = useCallback(async () => {
    if (!sessionId || Number.isNaN(sessionId)) {
      setLoading(false);
      setError('Mã phiên thi không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await sessionApi.getSessionQuestions(sessionId);
      const normalized = [...(data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
      setQuestions(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải câu hỏi cho phiên thi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setAnswersForQuestion = useCallback((variantQuestionId: number, answerIds: number[]) => {
    setAnswersByQuestion((prev) => ({ ...prev, [variantQuestionId]: answerIds }));
  }, []);

  const toggleAnswer = useCallback((variantQuestionId: number, answerId: number, multiSelect: boolean) => {
    setAnswersByQuestion((prev) => {
      const current = prev[variantQuestionId] ?? [];

      if (!multiSelect) {
        return { ...prev, [variantQuestionId]: [answerId] };
      }

      const exists = current.includes(answerId);
      const next = exists ? current.filter((id) => id !== answerId) : [...current, answerId];

      return { ...prev, [variantQuestionId]: next };
    });
  }, []);

  const stableAnswers = useMemo(() => answersByQuestion, [answersByQuestion]);

  return {
    questions,
    loading,
    error,
    answersByQuestion: stableAnswers,
    setAnswersForQuestion,
    toggleAnswer,
    refetch,
  };
};
