import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import type { AuthUser } from '@/shared/types/common';

/**
 * Khôi phục phiên đăng nhập từ cookie khi mở lại trình duyệt.
 *
 * `user` trả về lấy trực tiếp từ query data (fallback sang store) thay vì đọc
 * Zustand: guard cần biết user NGAY trong render đầu tiên sau khi query resolve.
 * Nếu đọc từ store, store chỉ được set trong effect nên guard sẽ thấy `null`
 * và đẩy người dùng về trang chủ dù đã đăng nhập hợp lệ.
 */
export function useCurrentUser() {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch {
        return null;
      }
    },
    staleTime: 0,
    retry: false,
  });

  const storedUser = useAuthStore((state) => state.user);
  const user: AuthUser | null = query.data ?? storedUser;

  return { ...query, user };
}
