import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/lib/ui/alert-dialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Pagination } from '@/shared/components/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useAuthStore } from '@/features/auth/store';
import {
  useCreateStudent,
  useCreateTeacher,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/features/users/hooks/useUsers';
import { RoleBadge } from '@/features/users/components/RoleBadge';
import { CredentialsDialog } from '@/features/users/components/CredentialsDialog';
import {
  createStudentSchema,
  createTeacherSchema,
  updateUserSchema,
  type CreateStudentFormValues,
  type CreateTeacherFormValues,
  type UpdateUserFormValues,
} from '@/features/users/schemas';
import type { UpdateUserRequest, User } from '@/features/users/types';
import { getApiErrorMessage } from '@/shared/lib/error-handler';

const PAGE_SIZE = 20;

type RoleFilter = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export function UserListPage() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  const usersQuery = useUsers();
  const createStudent = useCreateStudent();
  const createTeacher = useCreateTeacher();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [page, setPage] = useState(0);
  const debouncedKeyword = useDebounce(keyword);

  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const filtered = useMemo(() => {
    const rows = usersQuery.data ?? [];
    const term = debouncedKeyword.trim().toLowerCase();
    return rows.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      if (!matchesRole) return false;
      if (!term) return true;
      return (
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        (user.studentId ?? '').toLowerCase().includes(term)
      );
    });
  }, [usersQuery.data, debouncedKeyword, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const columns: Column<User>[] = [
    {
      id: 'name',
      header: 'Họ tên',
      cell: (user) => <span className="font-medium text-ink">{user.name}</span>,
    },
    {
      id: 'username',
      header: 'Tên đăng nhập',
      cell: (user) => <span className="tabular">{user.username}</span>,
    },
    {
      id: 'studentId',
      header: 'Mã sinh viên',
      hideBelow: 'sm',
      cell: (user) => <span className="tabular text-slate">{user.studentId ?? '—'}</span>,
    },
    {
      id: 'role',
      header: 'Vai trò',
      cell: (user) => <RoleBadge role={user.role} />,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'text-right',
      cell: (user) => (
        <div className="flex justify-end gap-1">
          {/* Backend chỉ cho sửa tài khoản có role TEACHER. */}
          {isAdmin && user.role === 'TEACHER' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Sửa tài khoản ${user.username}`}
              onClick={() => setEditingUser(user)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          {isAdmin ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Xoá tài khoản ${user.username}`}
              onClick={() => setDeletingUser(user)}
            >
              <Trash2 className="size-4 text-pen" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản"
        description="Quản lý tài khoản giáo viên và học sinh. Mật khẩu tạo ra chỉ hiển thị một lần."
        actions={
          <>
            <Button variant="outline" onClick={() => setTeacherDialogOpen(true)} disabled={!isAdmin}>
              <UserPlus className="size-4" aria-hidden="true" />
              Thêm giáo viên
            </Button>
            <Button onClick={() => setStudentDialogOpen(true)}>
              <UserPlus className="size-4" aria-hidden="true" />
              Thêm học sinh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="user-search">Tìm theo tên, tên đăng nhập hoặc MSSV</Label>
          <Input
            id="user-search"
            value={keyword}
            placeholder="Nhập từ khoá…"
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-filter">Vai trò</Label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleFilter);
              setPage(0);
            }}
            className="h-9 rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
          >
            <option value="ALL">Tất cả</option>
            <option value="ADMIN">Quản trị</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
          </select>
        </div>
      </div>

      {usersQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải danh sách tài khoản…</p>
      ) : usersQuery.isError ? (
        <ErrorState message={getApiErrorMessage(usersQuery.error)} onRetry={() => void usersQuery.refetch()} />
      ) : pageRows.length === 0 ? (
        <EmptyState
          title="Không có tài khoản phù hợp"
          description={
            filtered.length === 0
              ? 'Thử xoá bộ lọc hoặc tạo tài khoản mới.'
              : 'Chuyển sang trang khác để xem thêm.'
          }
          action={
            <Button variant="outline" onClick={() => setStudentDialogOpen(true)}>
              Thêm học sinh
            </Button>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey={(user) => user.id} />
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <CreateStudentDialog
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        onSubmit={async (values) => {
          const created = await createStudent.mutateAsync(values);
          setCredentials({ username: created.username, password: created.password });
        }}
      />

      {isAdmin ? (
        <CreateTeacherDialog
          open={teacherDialogOpen}
          onOpenChange={setTeacherDialogOpen}
          onSubmit={(values) => createTeacher.mutateAsync(values)}
        />
      ) : null}

      <EditUserDialog
        key={editingUser?.id ?? 'none'}
        user={editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={(id, payload) => updateUser.mutateAsync({ id, payload })}
      />

      <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài khoản này?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản “{deletingUser?.username}” sẽ bị xoá. Thao tác này dùng xoá mềm nên dữ liệu vẫn còn trong
              cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingUser) deleteUser.mutate(deletingUser.id);
              }}
            >
              Xoá tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CredentialsDialog
        open={Boolean(credentials)}
        onOpenChange={(open) => !open && setCredentials(null)}
        username={credentials?.username ?? ''}
        password={credentials?.password ?? ''}
      />
    </div>
  );
}

function CreateStudentDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateStudentFormValues) => Promise<unknown>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: { studentId: '', name: '' },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
      reset();
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không tạo được tài khoản học sinh.'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          setServerError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm học sinh</DialogTitle>
          <DialogDescription>
            Hệ thống tự sinh tên đăng nhập và mật khẩu. Thông tin này chỉ hiển thị một lần sau khi tạo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="student-name">Họ tên</Label>
            <Input id="student-name" aria-invalid={errors.name ? 'true' : undefined} {...register('name')} />
            {errors.name ? <p className="text-xs text-pen">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-id">Mã số sinh viên</Label>
            <Input id="student-id" aria-invalid={errors.studentId ? 'true' : undefined} {...register('studentId')} />
            {errors.studentId ? <p className="text-xs text-pen">{errors.studentId.message}</p> : null}
          </div>

          {serverError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit">Tạo tài khoản</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateTeacherDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateTeacherFormValues) => Promise<unknown>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: { username: '', password: '', name: '' },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
      reset();
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không tạo được tài khoản giáo viên.'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          setServerError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm giáo viên</DialogTitle>
          <DialogDescription>Bạn tự chọn tên đăng nhập và mật khẩu cho giáo viên.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-name">Họ tên</Label>
            <Input id="teacher-name" aria-invalid={errors.name ? 'true' : undefined} {...register('name')} />
            {errors.name ? <p className="text-xs text-pen">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-username">Tên đăng nhập</Label>
            <Input
              id="teacher-username"
              aria-invalid={errors.username ? 'true' : undefined}
              {...register('username')}
            />
            {errors.username ? <p className="text-xs text-pen">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-password">Mật khẩu</Label>
            <Input
              id="teacher-password"
              type="password"
              aria-invalid={errors.password ? 'true' : undefined}
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-pen">{errors.password.message}</p> : null}
          </div>

          {serverError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit">Tạo tài khoản</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, payload: UpdateUserRequest) => Promise<unknown>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: user?.name ?? '', username: user?.username ?? '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    if (!user) return;
    setServerError(null);
    try {
      // Partial update — chỉ gửi field thực sự đổi.
      const payload: UpdateUserRequest = {};
      if (values.name) payload.name = values.name;
      if (values.username) payload.username = values.username;
      if (values.password) payload.password = values.password;
      await onSubmit(user.id, payload);
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không cập nhật được tài khoản.'));
    }
  });

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(next) => {
        if (!next) setServerError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Sửa tài khoản giáo viên</DialogTitle>
          <DialogDescription>
            Để trống mật khẩu nếu không muốn thay đổi. Các trường khác trống sẽ được giữ nguyên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Họ tên</Label>
            <Input id="edit-name" aria-invalid={errors.name ? 'true' : undefined} {...register('name')} />
            {errors.name ? <p className="text-xs text-pen">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-username">Tên đăng nhập</Label>
            <Input
              id="edit-username"
              aria-invalid={errors.username ? 'true' : undefined}
              {...register('username')}
            />
            {errors.username ? <p className="text-xs text-pen">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-password">Mật khẩu mới</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="Để trống nếu không đổi"
              aria-invalid={errors.password ? 'true' : undefined}
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-pen">{errors.password.message}</p> : null}
          </div>

          {serverError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit">Lưu thay đổi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
