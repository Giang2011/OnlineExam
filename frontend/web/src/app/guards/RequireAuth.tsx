import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export function RequireAuth() {
  const { user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return <FullPageLoading />;
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}

export function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-live="polite">
      <span className="text-sm text-slate">Đang kiểm tra phiên đăng nhập…</span>
    </div>
  );
}
