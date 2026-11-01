import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createChapter,
  deleteChapter,
  getChapters,
  updateChapter,
} from '../api/chapterApi';
import type { Chapter, ChapterPayload } from '../types';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminChaptersResult {
  activeSubjectId: number | string | null;
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  search: string;
  filteredChapters: Chapter[];
  setActiveSubjectId: (subjectId: number | string | null) => void;
  setSearch: (value: string) => void;
  refetch: () => Promise<void>;
  createChapter: (payload: ChapterPayload) => Promise<Chapter | null>;
  updateChapter: (id: number | string, payload: ChapterPayload) => Promise<Chapter | null>;
  removeChapter: (id: number | string) => Promise<boolean>;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (chapter: Chapter, keyword: string) => {
  if (!keyword) return true;

  const haystack = [chapter.name, String(chapter.subjectId)].join(' ').toLowerCase();
  return haystack.includes(keyword);
};

export const useAdminChapters = (initialSubjectId: number | string | null = null): UseAdminChaptersResult => {
  const [activeSubjectId, setActiveSubjectId] = useState<number | string | null>(initialSubjectId);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadChapters = useCallback(async (subjectId: number | string | null = activeSubjectId) => {
    if (subjectId === null || subjectId === undefined || subjectId === '') {
      setChapters([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getChapters(subjectId);
      setChapters(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách chương.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeSubjectId]);

  useEffect(() => {
    void loadChapters(activeSubjectId);
  }, [activeSubjectId, loadChapters]);

  const filteredChapters = useMemo(() => {
    const keyword = normalizeText(search);
    return chapters.filter((chapter) => matchesSearch(chapter, keyword));
  }, [chapters, search]);

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

  const handleCreateChapter = useCallback(
    async (payload: ChapterPayload) => {
      if (activeSubjectId === null || activeSubjectId === undefined || activeSubjectId === '') {
        setError('Vui lòng chọn môn học trước khi tạo chương.');
        return null;
      }

      const result = await safeMutation(async () => createChapter(activeSubjectId, payload), async () => {
        await loadChapters(activeSubjectId);
      });
      return result;
    },
    [activeSubjectId, loadChapters],
  );

  const handleUpdateChapter = useCallback(
    async (id: number | string, payload: ChapterPayload) => {
      if (activeSubjectId === null || activeSubjectId === undefined || activeSubjectId === '') {
        setError('Vui lòng chọn môn học trước khi cập nhật chương.');
        return null;
      }

      const result = await safeMutation(async () => updateChapter(activeSubjectId, id, payload), async () => {
        await loadChapters(activeSubjectId);
      });
      return result;
    },
    [activeSubjectId, loadChapters],
  );

  const handleRemoveChapter = useCallback(
    async (id: number | string) => {
      if (activeSubjectId === null || activeSubjectId === undefined || activeSubjectId === '') {
        setError('Vui lòng chọn môn học trước khi xóa chương.');
        return false;
      }

      const result = await safeMutation(async () => {
        await deleteChapter(activeSubjectId, id);
        return true;
      }, async () => {
        await loadChapters(activeSubjectId);
      });

      return Boolean(result);
    },
    [activeSubjectId, loadChapters],
  );

  return {
    activeSubjectId,
    chapters,
    loading,
    error,
    search,
    filteredChapters,
    setActiveSubjectId,
    setSearch,
    refetch: () => loadChapters(activeSubjectId),
    createChapter: handleCreateChapter,
    updateChapter: handleUpdateChapter,
    removeChapter: handleRemoveChapter,
  };
};

export default useAdminChapters;
