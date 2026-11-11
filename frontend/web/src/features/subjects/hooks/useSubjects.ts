import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { subjectsApi } from '@/features/subjects/api';
import type { ChapterRequest, SubjectRequest } from '@/features/subjects/types';

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.list,
    queryFn: subjectsApi.list,
  });
}

/** Chi tiết môn học — dùng để đếm số câu có sẵn trong từng chương. */
export function useSubject(id: number | null) {
  return useQuery({
    queryKey: queryKeys.subjects.detail(id ?? 0),
    queryFn: () => subjectsApi.detail(id as number),
    enabled: id !== null,
  });
}

export function useChapters(subjectId: number | null) {
  return useQuery({
    queryKey: queryKeys.subjects.chapters(subjectId ?? 0),
    queryFn: () => subjectsApi.listChapters(subjectId as number),
    enabled: subjectId !== null,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubjectRequest) => subjectsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã tạo môn học.');
    },
    onError: (error) => showApiError(error, 'Không tạo được môn học.'),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubjectRequest }) =>
      subjectsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã cập nhật môn học.');
    },
    onError: (error) => showApiError(error, 'Không cập nhật được môn học.'),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subjectsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã xoá môn học.');
    },
    onError: (error) => showApiError(error, 'Không xoá được môn học.'),
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, payload }: { subjectId: number; payload: ChapterRequest }) =>
      subjectsApi.createChapter(subjectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã thêm chương.');
    },
    onError: (error) => showApiError(error, 'Không thêm được chương.'),
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subjectId,
      chapterId,
      payload,
    }: {
      subjectId: number;
      chapterId: number;
      payload: ChapterRequest;
    }) => subjectsApi.updateChapter(subjectId, chapterId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã cập nhật chương.');
    },
    onError: (error) => showApiError(error, 'Không cập nhật được chương.'),
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, chapterId }: { subjectId: number; chapterId: number }) =>
      subjectsApi.removeChapter(subjectId, chapterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
      toast.success('Đã xoá chương.');
    },
    onError: (error) => showApiError(error, 'Không xoá được chương.'),
  });
}
