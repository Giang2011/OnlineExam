import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { examsApi } from '@/features/exams/api';
import type { ExamRequest } from '@/features/exams/types';

export function useExams() {
  return useQuery({
    queryKey: queryKeys.exams.list,
    queryFn: examsApi.list,
  });
}

export function useExam(id: number | null) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id ?? 0),
    queryFn: () => examsApi.detail(id as number),
    enabled: id !== null,
  });
}

export function useParticipants(examId: number | null) {
  return useQuery({
    queryKey: queryKeys.exams.participants(examId ?? 0),
    queryFn: () => examsApi.listParticipants(examId as number),
    enabled: examId !== null,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExamRequest) => examsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      toast.success('Đã tạo kỳ thi và sinh đề.');
    },
    onError: (error) => showApiError(error, 'Không tạo được kỳ thi.'),
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExamRequest }) => examsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      toast.success('Đã cập nhật kỳ thi.');
    },
    onError: (error) => showApiError(error, 'Không cập nhật được kỳ thi.'),
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => examsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      toast.success('Đã xoá kỳ thi.');
    },
    onError: (error) => showApiError(error, 'Không xoá được kỳ thi.'),
  });
}

export function useAddParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, userId }: { examId: number; userId: number }) =>
      examsApi.addParticipant(examId, userId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.participants(variables.examId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      toast.success('Đã thêm thí sinh vào kỳ thi.');
    },
    onError: (error) => showApiError(error, 'Không thêm được thí sinh.'),
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, userId }: { examId: number; userId: number }) =>
      examsApi.removeParticipant(examId, userId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.participants(variables.examId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      toast.success('Đã xoá thí sinh khỏi kỳ thi.');
    },
    onError: (error) => showApiError(error, 'Không xoá được thí sinh.'),
  });
}
