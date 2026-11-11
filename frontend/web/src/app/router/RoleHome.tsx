import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import type { Role } from '@/shared/types/common';

/** Trang chủ phân tuyến theo vai trò. */
export function RoleHome() {
  const user = useAuthStore((state) => state.user);
  const role: Role | undefined = user?.role;

  const homePath = role === 'STUDENT' ? '/my-exams' : role ? '/exams' : '/login';

  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-5">
        <h1 className="font-serif text-2xl font-semibold text-ink">Chào {user?.name ?? 'bạn'}</h1>
        <p className="mt-1.5 text-sm text-slate">
          {role === 'STUDENT'
            ? 'Dưới đây là các kỳ thi được phân công cho bạn.'
            : 'Dưới đây là các kỳ thi đang được quản lý.'}
        </p>
      </header>
      <div>
        <Link
          to={homePath}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-chalk-deep"
        >
          Đi tới danh sách kỳ thi
        </Link>
      </div>
    </div>
  );
}
