import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../api/subjectApi';
import type { Subject, SubjectPayload } from '../types';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminSubjectsResult {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  search: string;
  filteredSubjects: Subject[];
  refetch: () => Promise<void>;
  setSearch: (value: string) => void;
  createSubject: (payload: SubjectPayload) => Promise<Subject | null>;
  updateSubject: (id: number | string, payload: SubjectPayload) => Promise<Subject | null>;
  removeSubject: (id: number | string) => Promise<boolean>;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (subject: Subject, keyword: string) => {
  if (!keyword) return true;

  const haystack = [subject.name, ...(subject.chapters ?? []).map((chapter) => chapter.name)]
    .join(' ')
    .toLowerCase();

  return haystack.includes(keyword);
};

export const useAdminSubjects = (): UseAdminSubjectsResult => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách môn học.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const filteredSubjects = useMemo(() => {
    const keyword = normalizeText(search);
    return subjects.filter((subject) => matchesSearch(subject, keyword));
  }, [search, subjects]);

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

  const handleCreateSubject = useCallback(
    async (payload: SubjectPayload) => {
      const result = await safeMutation(async () => createSubject(payload), async () => {
        await loadSubjects();
      });
      return result;
    },
    [loadSubjects],
  );

  const handleUpdateSubject = useCallback(
    async (id: number | string, payload: SubjectPayload) => {
      const result = await safeMutation(async () => updateSubject(id, payload), async () => {
        await loadSubjects();
      });
      return result;
    },
    [loadSubjects],
  );

  const handleRemoveSubject = useCallback(
    async (id: number | string) => {
      const result = await safeMutation(async () => {
        await deleteSubject(id);
        return true;
      }, async () => {
        await loadSubjects();
      });

      return Boolean(result);
    },
    [loadSubjects],
  );

  return {
    subjects,
    loading,
    error,
    search,
    filteredSubjects,
    refetch: loadSubjects,
    setSearch,
    createSubject: handleCreateSubject,
    updateSubject: handleUpdateSubject,
    removeSubject: handleRemoveSubject,
  };
};

export default useAdminSubjects;
