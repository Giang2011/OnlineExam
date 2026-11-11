import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { sessionsApi } from '@/features/exam-taking/api';
import type { DraftAnswer } from '@/features/exam-taking/types';

export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: sessionsApi.active,
    retry: false,
    staleTime: 0,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: number) => sessionsApi.start(examId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
    },
    onError: (error) => showApiError(error, 'Không bắt đầu được phiên thi.'),
  });
}

export function useSessionDetail(sessionId: number | null) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId ?? 0),
    queryFn: () => sessionsApi.detail(sessionId as number),
    enabled: sessionId !== null,
    staleTime: 0,
    retry: false,
  });
}

export function useSessionQuestions(sessionId: number | null) {
  return useQuery({
    queryKey: queryKeys.sessions.questions(sessionId ?? 0),
    queryFn: () => sessionsApi.questions(sessionId as number),
    enabled: sessionId !== null,
    staleTime: 0,
    retry: false,
  });
}

export function useDraftAnswers(sessionId: number | null) {
  return useQuery({
    queryKey: queryKeys.sessions.answers(sessionId ?? 0),
    queryFn: () => sessionsApi.getAnswers(sessionId as number),
    enabled: sessionId !== null,
    staleTime: 0,
    retry: false,
  });
}

export function useSaveAnswers(sessionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: DraftAnswer[]) => sessionsApi.saveAnswers(sessionId as number, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.answers(sessionId ?? 0) });
    },
    onError: (error) => showApiError(error, 'Không lưu được đáp án.'),
  });
}

export function useSubmitSession(sessionId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: DraftAnswer[]) => sessionsApi.submit(sessionId as number, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
      void queryClient.invalidateQueries({ queryKey: queryKeys.results.me });
    },
    onError: (error) => showApiError(error, 'Không nộp được bài.'),
  });
}
