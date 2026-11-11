import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { questionsApi, type QuestionListParams } from '@/features/questions/api';
import type { QuestionRequest } from '@/features/questions/types';

export function useQuestions(params: QuestionListParams) {
  return useQuery({
    queryKey: queryKeys.questions.list(params),
    queryFn: () => questionsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useQuestion(id: number | null) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id ?? 0),
    queryFn: () => questionsApi.detail(id as number),
    enabled: id !== null,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      questionImage,
      answerImages,
    }: {
      data: QuestionRequest;
      questionImage: File | null;
      answerImages: (File | null)[];
    }) => questionsApi.create(data, questionImage, answerImages),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
      toast.success('Đã tạo câu hỏi.');
    },
    onError: (error) => showApiError(error, 'Không tạo được câu hỏi.'),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      questionImage,
      answerImages,
    }: {
      id: number;
      data: QuestionRequest;
      questionImage: File | null;
      answerImages: (File | null)[];
    }) => questionsApi.update(id, data, questionImage, answerImages),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
      toast.success('Đã cập nhật câu hỏi.');
    },
    onError: (error) => showApiError(error, 'Không cập nhật được câu hỏi.'),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => questionsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
      toast.success('Đã xoá câu hỏi.');
    },
    onError: (error) => showApiError(error, 'Không xoá được câu hỏi.'),
  });
}
