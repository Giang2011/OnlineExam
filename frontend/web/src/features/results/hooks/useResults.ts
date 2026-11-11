import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { resultsApi } from '@/features/results/api';

export function useMyResults() {
  return useQuery({
    queryKey: queryKeys.results.me,
    queryFn: resultsApi.me,
  });
}

export function useSessionResult(sessionId: number | null) {
  return useQuery({
    queryKey: queryKeys.results.session(sessionId ?? 0),
    queryFn: () => resultsApi.session(sessionId as number),
    enabled: sessionId !== null,
  });
}

export function useExamResults(examId: number | null) {
  return useQuery({
    queryKey: queryKeys.results.exam(examId ?? 0),
    queryFn: () => resultsApi.exam(examId as number),
    enabled: examId !== null,
    retry: false,
  });
}
