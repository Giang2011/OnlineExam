import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/lib/query-keys';
import { showApiError } from '@/shared/lib/error-handler';
import { usersApi } from '@/features/users/api';
import type { CreateStudentRequest, CreateTeacherRequest, UpdateUserRequest } from '@/features/users/types';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: usersApi.list,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentRequest) => usersApi.createStudent(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Đã tạo tài khoản học sinh.');
    },
    onError: (error) => showApiError(error, 'Không tạo được tài khoản học sinh.'),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherRequest) => usersApi.createTeacher(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Đã tạo tài khoản giáo viên.');
    },
    onError: (error) => showApiError(error, 'Không tạo được tài khoản giáo viên.'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserRequest }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Đã cập nhật tài khoản.');
    },
    onError: (error) => showApiError(error, 'Không cập nhật được tài khoản.'),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Đã xoá tài khoản.');
    },
    onError: (error) => showApiError(error, 'Không xoá được tài khoản.'),
  });
}
