import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import type { Role } from '@/shared/types/common';
import { FullPageLoading } from '@/app/guards/RequireAuth';

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user, isPending } = useCurrentUser();

  const allowed = user ? roles.includes(user.role) : false;

  // Không có quyền: báo rõ ràng bằng toast thay vì redirect im lặng — người dùng
  // cần biết vì sao mình không thấy trang đó.
  useEffect(() => {
    if (!isPending && user && !allowed) {
      toast.error('Bạn không có quyền truy cập trang này.');
    }
  }, [isPending, user, allowed]);

  if (isPending) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
