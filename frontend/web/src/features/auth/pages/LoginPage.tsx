import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { useLogin } from '@/features/auth/hooks/useAuthMutations';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { ApiError } from '@/shared/types/api-error';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const response = await login.mutateAsync(values);
      const next = searchParams.get('next');
      toast.success(`Đăng nhập thành công. Xin chào ${response.user.name}.`);
      navigate(next && next.startsWith('/') ? next : '/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(
          error.status === 401
            ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
            : error.message,
        );
      } else {
        setFormError('Không kết nối được tới máy chủ. Thử lại sau ít phút.');
      }
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-md border border-rule bg-paper-raised p-6 shadow-xs">
        <h1 className="text-lg font-semibold text-ink">Đăng nhập</h1>
        <p className="mt-1 text-sm text-slate">Dùng tài khoản do quản trị viên cấp.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              aria-invalid={errors.username ? 'true' : undefined}
              {...register('username')}
            />
            {errors.username ? (
              <p className="text-xs text-pen">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-pen">{errors.password.message}</p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  );
}
