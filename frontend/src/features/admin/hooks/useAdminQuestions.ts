import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  updateQuestion,
  type QuestionFormDataInput,
  type QuestionQueryParams,
} from '../api/questionApi';
import type { Question } from '../types';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminQuestionsFilters {
  subjectId?: number;
  chapterId?: number;
  search?: string;
  page?: number;
  size?: number;
}

export interface UseAdminQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: string | null;
  search: string;
  page: number;
  size: number;
  subjectId: number | null;
  chapterId: number | null;
  selectedQuestion: Question | null;
  setSearch: (value: string) => void;
  setPage: (value: number) => void;
  setSize: (value: number) => void;
  setSubjectId: (value: number | null) => void;
  setChapterId: (value: number | null) => void;
  selectQuestion: (id: number | string | null) => Promise<Question | null>;
  refetch: () => Promise<void>;
  createQuestion: (input: QuestionFormDataInput) => Promise<Question | null>;
  updateQuestion: (id: number | string, input: QuestionFormDataInput) => Promise<Question | null>;
  removeQuestion: (id: number | string) => Promise<boolean>;
  filteredQuestions: Question[];
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (question: Question, keyword: string) => {
  if (!keyword) return true;
  const haystack = [question.content, String(question.subjectId), String(question.chapterId)]
    .join(' ')
    .toLowerCase();

  return haystack.includes(keyword);
};

const normalizeQuestions = (data: unknown): Question[] => {
  if (Array.isArray(data)) return data as Question[];

  if (data && typeof data === 'object') {
    const payload = data as {
      content?: unknown;
      items?: unknown;
      data?: unknown;
      results?: unknown;
      questions?: unknown;
    };

    const candidates = [payload.content, payload.items, payload.data, payload.results, payload.questions];
    const list = candidates.find(Array.isArray);
    if (list) return list as Question[];
  }

  return [];
};

export const useAdminQuestions = (
  initialFilters: UseAdminQuestionsFilters = {},
): UseAdminQuestionsResult => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [page, setPage] = useState(initialFilters.page ?? 0);
  const [size, setSize] = useState(initialFilters.size ?? 20);
  const [subjectId, setSubjectId] = useState<number | null>(initialFilters.subjectId ?? null);
  const [chapterId, setChapterId] = useState<number | null>(initialFilters.chapterId ?? null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const buildQueryParams = useCallback((): QuestionQueryParams => {
    const params: QuestionQueryParams = { page, size };

    if (subjectId !== null) params.subjectId = subjectId;
    if (chapterId !== null) params.chapterId = chapterId;

    return params;
  }, [chapterId, page, size, subjectId]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getQuestions(buildQueryParams());
      setQuestions(normalizeQuestions(data));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách câu hỏi.');
      }
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    setPage(0);
  }, [subjectId, chapterId]);

  const filteredQuestions = useMemo(() => {
    const keyword = normalizeText(search);
    return questions.filter((question) => matchesSearch(question, keyword));
  }, [questions, search]);

  const safeMutation = async <T,>(mutation: () => Promise<T>, afterSuccess?: (result: T) => void) => {
    setError(null);

    try {
      const result = await mutation();
      await afterSuccess?.(result);
      return result;
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Đã xảy ra lỗi, vui lòng thử lại.');
      }
      return null;
    }
  };

  const selectQuestion = useCallback(async (id: number | string | null) => {
    if (id === null) {
      setSelectedQuestion(null);
      return null;
    }

    const result = await safeMutation(async () => getQuestionById(id), (question) => {
      setSelectedQuestion(question);
    });

    return result;
  }, []);

  const handleCreateQuestion = useCallback(
    async (input: QuestionFormDataInput) => {
      const result = await safeMutation(async () => createQuestion(input), async () => {
        await loadQuestions();
      });
      return result;
    },
    [loadQuestions],
  );

  const handleUpdateQuestion = useCallback(
    async (id: number | string, input: QuestionFormDataInput) => {
      const result = await safeMutation(async () => updateQuestion(id, input), async (updatedQuestion) => {
        await loadQuestions();

        if (selectedQuestion?.id === updatedQuestion.id) {
          setSelectedQuestion(updatedQuestion);
        }
      });

      return result;
    },
    [loadQuestions, selectedQuestion?.id],
  );

  const handleRemoveQuestion = useCallback(
    async (id: number | string) => {
      const result = await safeMutation(async () => {
        await deleteQuestion(id);
        return true;
      }, async () => {
        await loadQuestions();
        if (selectedQuestion && String(selectedQuestion.id) === String(id)) {
          setSelectedQuestion(null);
        }
      });

      return Boolean(result);
    },
    [loadQuestions, selectedQuestion],
  );

  return {
    questions,
    loading,
    error,
    search,
    page,
    size,
    subjectId,
    chapterId,
    selectedQuestion,
    setSearch,
    setPage,
    setSize,
    setSubjectId,
    setChapterId,
    selectQuestion,
    refetch: loadQuestions,
    createQuestion: handleCreateQuestion,
    updateQuestion: handleUpdateQuestion,
    removeQuestion: handleRemoveQuestion,
    filteredQuestions,
  };
};

export default useAdminQuestions;
