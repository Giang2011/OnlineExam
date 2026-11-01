import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  addParticipant,
  getParticipants,
  removeParticipant,
  type AddParticipantPayload,
  type Participant,
} from '../api/participantApi';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminParticipantsOptions {
  examId?: number | null;
  initialSearch?: string;
}

export interface UseAdminParticipantsResult {
  examId: number | null;
  participants: Participant[];
  filteredParticipants: Participant[];
  selectedParticipantIds: number[];
  loading: boolean;
  error: string | null;
  search: string;
  refetch: () => Promise<void>;
  setExamId: (id: number | null) => void;
  setSearch: (value: string) => void;
  setSelectedParticipantIds: (ids: number[]) => void;
  toggleParticipantSelection: (userId: number) => void;
  clearSelection: () => void;
  addParticipant: (payload: AddParticipantPayload) => Promise<boolean>;
  removeParticipant: (userId: number | string) => Promise<boolean>;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (participant: Participant, keyword: string) => {
  if (!keyword) return true;

  const haystack = [participant.username, participant.name, participant.studentId].join(' ').toLowerCase();
  return haystack.includes(keyword);
};

export const useAdminParticipants = (
  options: UseAdminParticipantsOptions = {},
): UseAdminParticipantsResult => {
  const [examId, setExamId] = useState<number | null>(options.examId ?? null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(options.initialSearch ?? '');

  const loadParticipants = useCallback(async () => {
    if (examId === null) {
      setParticipants([]);
      setSelectedParticipantIds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getParticipants(examId);
      setParticipants(data);
      setSelectedParticipantIds((prev) => prev.filter((id) => data.some((item) => item.userId === id)));
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách thí sinh.');
      }
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const filteredParticipants = useMemo(() => {
    const keyword = normalizeText(search);
    return participants.filter((participant) => matchesSearch(participant, keyword));
  }, [participants, search]);

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

  const handleAddParticipant = useCallback(
    async (payload: AddParticipantPayload) => {
      if (examId === null) {
        setError('Vui lòng chọn kỳ thi trước khi thêm thí sinh.');
        return false;
      }

      const result = await safeMutation(async () => {
        await addParticipant(examId, payload);
        return true;
      }, async () => {
        await loadParticipants();
      });

      return Boolean(result);
    },
    [examId, loadParticipants],
  );

  const handleRemoveParticipant = useCallback(
    async (userId: number | string) => {
      if (examId === null) {
        setError('Vui lòng chọn kỳ thi trước khi xóa thí sinh.');
        return false;
      }

      const result = await safeMutation(async () => {
        await removeParticipant(examId, userId);
        return true;
      }, async () => {
        await loadParticipants();
      });

      return Boolean(result);
    },
    [examId, loadParticipants],
  );

  const toggleParticipantSelection = useCallback((userId: number) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParticipantIds([]);
  }, []);

  return {
    examId,
    participants,
    filteredParticipants,
    selectedParticipantIds,
    loading,
    error,
    search,
    refetch: loadParticipants,
    setExamId,
    setSearch,
    setSelectedParticipantIds,
    toggleParticipantSelection,
    clearSelection,
    addParticipant: handleAddParticipant,
    removeParticipant: handleRemoveParticipant,
  };
};

export default useAdminParticipants;
