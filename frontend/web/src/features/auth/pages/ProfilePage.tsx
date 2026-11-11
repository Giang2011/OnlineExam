import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { PageHeader } from '@/shared/components/PageHeader';
import { useAuthStore } from '@/features/auth/store';
import { useUpdateSelf } from '@/features/auth/hooks/useAuthMutations';
import { profileSchema, type ProfileFormValues } from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/shared/lib/error-handler';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateSelf = useUpdateSelf();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      password: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateSelf.mutateAsync({
        name: values.name,
        username: values.username,
        ...(values.password ? { password: values.password } : {}),
      });
    } catch {
      // Thông báo đã hiển thị qua toast trong hook.
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hồ sơ cá nhân" />
        <p className="text-sm text-slate">
          Học sinh không tự cập nhật được thông tin tài khoản. Liên hệ giáo viên nếu cần đổi mật khẩu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Tên đăng nhập và mật khẩu dùng để đăng nhập vào hệ thống."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-md space-y-4 rounded-md border border-rule bg-paper-raised p-5"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Tên hiển thị</Label>
          <Input id="name" aria-invalid={errors.name ? 'true' : undefined} {...register('name')} />
          {errors.name ? <p className="text-xs text-pen">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Tên đăng nhập</Label>
          <Input id="username" aria-invalid={errors.username ? 'true' : undefined} {...register('username')} />
          {errors.username ? <p className="text-xs text-pen">{errors.username.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Để trống nếu không đổi"
            aria-invalid={errors.password ? 'true' : undefined}
            {...register('password')}
          />
          {errors.password ? <p className="text-xs text-pen">{errors.password.message}</p> : null}
        </div>

        {updateSelf.isError ? (
          <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
            {getApiErrorMessage(updateSelf.error)}
          </p>
        ) : null}

        <Button type="submit" disabled={updateSelf.isPending}>
          {updateSelf.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </form>
    </div>
  );
}
