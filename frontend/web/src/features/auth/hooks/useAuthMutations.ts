import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      setUser(response.user);
      void queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useUpdateSelf() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: authApi.updateSelf,
    onSuccess: (user) => {
      setUser(user);
      toast.success('Đã cập nhật thông tin cá nhân.');
    },
  });
}
