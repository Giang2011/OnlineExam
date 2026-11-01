import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createExam,
  deleteExam,
  getExamById,
  getExams,
  updateExam,
  type CreateExamPayload,
  type ExamResponse,
  type UpdateExamPayload,
} from '../api/examApi';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminExamsOptions {
  initialSearch?: string;
}

export interface UseAdminExamsResult {
  exams: ExamResponse[];
  filteredExams: ExamResponse[];
  loading: boolean;
  error: string | null;
  search: string;
  selectedExamId: number | null;
  selectedExam: ExamResponse | null;
  selectingExam: boolean;
  refetch: () => Promise<void>;
  setSearch: (value: string) => void;
  setSelectedExamId: (id: number | null) => void;
  selectExam: (id: number | string | null) => Promise<ExamResponse | null>;
  createExam: (payload: CreateExamPayload) => Promise<ExamResponse | null>;
  updateExam: (id: number | string, payload: UpdateExamPayload) => Promise<ExamResponse | null>;
  removeExam: (id: number | string) => Promise<boolean>;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (exam: ExamResponse, keyword: string) => {
  if (!keyword) return true;

  const haystack = [exam.title, exam.subjectName ?? '', String(exam.subjectId)].join(' ').toLowerCase();
  return haystack.includes(keyword);
};

export const useAdminExams = (options: UseAdminExamsOptions = {}): UseAdminExamsResult => {
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingExam, setSelectingExam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(options.initialSearch ?? '');
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamResponse | null>(null);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getExams();
      setExams(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách kỳ thi.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const filteredExams = useMemo(() => {
    const keyword = normalizeText(search);
    return exams.filter((exam) => matchesSearch(exam, keyword));
  }, [exams, search]);

  const safeMutation = async <T,>(mutation: () => Promise<T>, afterSuccess?: (result: T) => void) => {
    setError(null);

    try {
      const result = await mutation();
      afterSuccess?.(result);
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

  const selectExam = useCallback(async (id: number | string | null) => {
    if (id === null) {
      setSelectedExamId(null);
      setSelectedExam(null);
      return null;
    }

    setSelectingExam(true);
    setError(null);

    try {
      const detail = await getExamById(id);
      setSelectedExamId(detail.id);
      setSelectedExam(detail);
      return detail;
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải chi tiết kỳ thi.');
      }
      return null;
    } finally {
      setSelectingExam(false);
    }
  }, []);

  const handleCreateExam = useCallback(
    async (payload: CreateExamPayload) => {
      const result = await safeMutation(async () => createExam(payload), async (created) => {
        await loadExams();
        setSelectedExamId(created.id);
        setSelectedExam(created);
      });
      return result;
    },
    [loadExams],
  );

  const handleUpdateExam = useCallback(
    async (id: number | string, payload: UpdateExamPayload) => {
      const result = await safeMutation(async () => updateExam(id, payload), async (updated) => {
        await loadExams();
        if (selectedExamId === updated.id) {
          setSelectedExam(updated);
        }
      });
      return result;
    },
    [loadExams, selectedExamId],
  );

  const handleRemoveExam = useCallback(
    async (id: number | string) => {
      const result = await safeMutation(async () => {
        await deleteExam(id);
        return true;
      }, async () => {
        await loadExams();
        if (selectedExamId === Number(id)) {
          setSelectedExamId(null);
          setSelectedExam(null);
        }
      });

      return Boolean(result);
    },
    [loadExams, selectedExamId],
  );

  return {
    exams,
    filteredExams,
    loading,
    error,
    search,
    selectedExamId,
    selectedExam,
    selectingExam,
    refetch: loadExams,
    setSearch,
    setSelectedExamId,
    selectExam,
    createExam: handleCreateExam,
    updateExam: handleUpdateExam,
    removeExam: handleRemoveExam,
  };
};

export default useAdminExams;
