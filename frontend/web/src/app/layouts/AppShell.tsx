import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  FileStack,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  ScanLine,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/lib/ui/sheet';
import { useAuthStore } from '@/features/auth/store';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import type { Role } from '@/shared/types/common';
import { cn } from '@/shared/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/exams', label: 'Kỳ thi', icon: LayoutGrid, roles: ['ADMIN', 'TEACHER'] },
  { to: '/questions', label: 'Ngân hàng câu hỏi', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
  { to: '/subjects', label: 'Môn học', icon: GraduationCap, roles: ['ADMIN', 'TEACHER'] },
  { to: '/paper-exams', label: 'Đề giấy & OMR', icon: ScanLine, roles: ['ADMIN', 'TEACHER'] },
  { to: '/results', label: 'Bảng điểm', icon: ClipboardList, roles: ['ADMIN', 'TEACHER'] },
  { to: '/users', label: 'Tài khoản', icon: Users, roles: ['ADMIN', 'TEACHER'] },
  { to: '/my-exams', label: 'Kỳ thi của tôi', icon: FileStack, roles: ['STUDENT'] },
  { to: '/my-results', label: 'Kết quả của tôi', icon: ClipboardList, roles: ['STUDENT'] },
];

function useVisibleNavItems() {
  const role = useAuthStore((state) => state.user?.role);
  return NAV_ITEMS.filter((item) => (role ? item.roles.includes(role) : false));
}

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const items = useVisibleNavItems();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="hidden h-screen w-64 shrink-0 flex-col bg-ink lg:sticky lg:top-0 lg:flex">
        <RailContent items={items} onLogout={handleLogout} userName={user?.name ?? ''} />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-30 lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-ink p-0 text-paper">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu điều hướng</SheetTitle>
          </SheetHeader>
          <RailContent
            items={items}
            onLogout={handleLogout}
            userName={user?.name ?? ''}
            onNavigate={() => setDrawerOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RailContent({
  items,
  onLogout,
  userName,
  onNavigate,
}: {
  items: NavItem[];
  onLogout: () => void;
  userName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link to="/" className="block" onClick={onNavigate}>
          <p className="font-serif text-lg font-semibold text-paper">Phòng thi</p>
          <p className="mt-0.5 text-xs text-paper/60">Quản lý thi trắc nghiệm</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-chalk text-white'
                  : 'text-paper/75 hover:bg-white/10 hover:text-paper',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-chalk text-white' : 'text-paper/75 hover:bg-white/10 hover:text-paper',
            )
          }
        >
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{userName || 'Hồ sơ'}</span>
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-paper/75 transition-colors hover:bg-white/10 hover:text-paper"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
