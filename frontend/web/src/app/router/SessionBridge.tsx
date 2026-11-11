import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { setUnauthorizedHandler } from '@/shared/lib/api-client';
import { useAuthStore } from '@/features/auth/store';

/**
 * Cầu nối giữa api-client và router:
 * - Khi API trả 401 -> xoá session phía FE và chuyển hướng về trang đăng nhập.
 * - 403 không làm gì ở đây (chỉ toast).
 */
export function SessionBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clear();
      const next = `${location.pathname}${location.search}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, location.pathname, location.search]);

  // Route gốc nên phải render Outlet để các route con hiển thị.
  return <Outlet />;
}
