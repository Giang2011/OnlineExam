import { QueryClient, QueryCache } from '@tanstack/react-query';
import { ApiError } from '@/shared/types/api-error';
import { queryKeys } from '@/shared/lib/query-keys';
import { useAuthStore } from '@/features/auth/store';
import type { AuthUser } from '@/shared/types/common';

/**
 * QueryClient dùng chung cho toàn app.
 *
 * Query `auth.me` được đồng bộ vào Zustand store tại đây (thay vì trong component)
 * để mọi guard đọc được user ngay khi query resolve, không phụ thuộc thứ tự effect.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onSuccess: (data, query) => {
        if (query.queryKey !== queryKeys.auth.me) return;
        if (data) {
          useAuthStore.getState().setUser(data as AuthUser);
        } else {
          useAuthStore.getState().clear();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Không retry lỗi 4xx — lỗi do người dùng/quyền sẽ không tự khỏi.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
