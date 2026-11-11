import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { FullPageLoading } from '@/app/guards/RequireAuth';

export function GuestOnly() {
  const { user, isPending } = useCurrentUser();

  if (isPending) {
    return <FullPageLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
