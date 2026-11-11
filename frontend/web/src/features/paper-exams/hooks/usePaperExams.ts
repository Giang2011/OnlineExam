import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { paperExamsApi } from '@/features/paper-exams/api';
import type { PaperExamRequest } from '@/features/paper-exams/types';

export function usePaperExams() {
  return useQuery({
    queryKey: queryKeys.paperExams.list,
    queryFn: paperExamsApi.list,
  });
}

export function usePaperExam(id: number | null) {
  return useQuery({
    queryKey: queryKeys.paperExams.detail(id ?? 0),
    queryFn: () => paperExamsApi.detail(id as number),
    enabled: id !== null,
  });
}

export function usePaperExamAnswers(id: number | null) {
  return useQuery({
    queryKey: queryKeys.paperExams.answers(id ?? 0),
    queryFn: () => paperExamsApi.answers(id as number),
    enabled: id !== null,
  });
}

export function useScanResults(id: number | null) {
  return useQuery({
    queryKey: queryKeys.paperExams.scanResults(id ?? 0),
    queryFn: () => paperExamsApi.scanResults(id as number),
    enabled: id !== null,
  });
}

export function useCreatePaperExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaperExamRequest) => paperExamsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paperExams.all });
      toast.success('Đã tạo đề giấy.');
    },
    onError: (error) => showApiError(error, 'Không tạo được đề giấy.'),
  });
}

export function useDeletePaperExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paperExamsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paperExams.all });
      toast.success('Đã xoá đề giấy.');
    },
    onError: (error) => showApiError(error, 'Không xoá được đề giấy.'),
  });
}

export function useScanPaperExam(id: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      images,
      actualQuestionCount,
      debug,
    }: {
      images: File[];
      actualQuestionCount?: number;
      debug?: boolean;
    }) => paperExamsApi.scan(id as number, images, { actualQuestionCount, debug }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paperExams.scanResults(id ?? 0) });
      toast.success('Đã chấm điểm phiếu trả lời.');
    },
    onError: (error) => showApiError(error, 'Không chấm được phiếu trả lời.'),
  });
}
