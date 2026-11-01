import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  createStudent,
  createTeacher,
  deleteUser,
  getUsers,
  updateMe,
  updateUser,
} from '../api/userApi';
import type {
  AdminUser,
  CreateStudentPayload,
  CreateStudentResponse,
  CreateTeacherPayload,
  UpdateProfilePayload,
  UpdateUserPayload,
} from '../types';
import { authStorage, type UserRole } from '../../../shared/lib/authStorage';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';

export interface UseAdminUsersOptions {
  initialSearch?: string;
}

export interface UseAdminUsersResult {
  users: AdminUser[];
  filteredUsers: AdminUser[];
  loading: boolean;
  error: string | null;
  search: string;
  currentRole: UserRole | null;
  isAdmin: boolean;
  isTeacher: boolean;
  refetch: () => Promise<void>;
  setSearch: (value: string) => void;
  createStudent: (payload: CreateStudentPayload) => Promise<CreateStudentResponse | null>;
  createTeacher: (payload: CreateTeacherPayload) => Promise<AdminUser | null>;
  updateUser: (id: number | string, payload: UpdateUserPayload) => Promise<AdminUser | null>;
  updateMe: (payload: UpdateProfilePayload) => Promise<AdminUser | null>;
  removeUser: (id: number | string) => Promise<boolean>;
}

const normalizeText = (value: string) => value.trim().toLowerCase();

const matchesSearch = (user: AdminUser, keyword: string) => {
  if (!keyword) return true;

  const haystack = [user.username, user.name, user.studentId ?? '', user.role]
    .join(' ')
    .toLowerCase();

  return haystack.includes(keyword);
};

export const useAdminUsers = (options: UseAdminUsersOptions = {}): UseAdminUsersResult => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(options.initialSearch ?? '');

  const currentRole = authStorage.getRole();
  const isAdmin = currentRole === 'ADMIN';
  const isTeacher = currentRole === 'TEACHER';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Không thể tải danh sách người dùng.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = normalizeText(search);
    return users.filter((user) => matchesSearch(user, keyword));
  }, [search, users]);

  const safeMutation = async <T,>(mutation: () => Promise<T>, afterSuccess?: (result: T) => void) => {
    setError(null);

    try {
      const result = await mutation();
      afterSuccess?.(result);
      return result;
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(normalizeApiErrorMessage(err));
      } else {
        setError('Đã xảy ra lỗi, vui lòng thử lại.');
      }
      return null;
    }
  };

  const handleCreateStudent = useCallback(
    async (payload: CreateStudentPayload) => {
      const result = await safeMutation(async () => createStudent(payload), async () => {
        await loadUsers();
      });
      return result;
    },
    [loadUsers],
  );

  const handleCreateTeacher = useCallback(
    async (payload: CreateTeacherPayload) => {
      const result = await safeMutation(async () => createTeacher(payload), async () => {
        await loadUsers();
      });
      return result;
    },
    [loadUsers],
  );

  const handleUpdateUser = useCallback(
    async (id: number | string, payload: UpdateUserPayload) => {
      const result = await safeMutation(async () => updateUser(id, payload), async () => {
        await loadUsers();
      });
      return result;
    },
    [loadUsers],
  );

  const handleUpdateMe = useCallback(
    async (payload: UpdateProfilePayload) => {
      const result = await safeMutation(async () => updateMe(payload), async () => {
        await loadUsers();
      });
      return result;
    },
    [loadUsers],
  );

  const handleRemoveUser = useCallback(
    async (id: number | string) => {
      const result = await safeMutation(async () => {
        await deleteUser(id);
        return true;
      }, async () => {
        await loadUsers();
      });

      return Boolean(result);
    },
    [loadUsers],
  );

  return {
    users,
    filteredUsers,
    loading,
    error,
    search,
    currentRole,
    isAdmin,
    isTeacher,
    refetch: loadUsers,
    setSearch,
    createStudent: handleCreateStudent,
    createTeacher: handleCreateTeacher,
    updateUser: handleUpdateUser,
    updateMe: handleUpdateMe,
    removeUser: handleRemoveUser,
  };
};

export default useAdminUsers;
