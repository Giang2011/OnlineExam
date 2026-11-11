import { Outlet } from 'react-router-dom';

/** Layout cho màn hình đăng nhập: một cột, canh giữa. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="px-6 pt-8">
        <p className="font-serif text-xl font-semibold text-ink">Phòng thi</p>
        <p className="mt-0.5 text-sm text-slate">Quản lý thi trắc nghiệm</p>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
