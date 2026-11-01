import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  User,
  LogOut,
  Award,
  Hexagon,
  Menu,
  X,
} from 'lucide-react';
import { authStorage } from '../../../shared/lib/authStorage';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const userName =
    localStorage.getItem('name') ||
    localStorage.getItem('fullName') ||
    localStorage.getItem('username') ||
    'Thí sinh';
  const firstLetter = (userName.trim().charAt(0) || 'T').toUpperCase();

  const handleLogout = () => {
    authStorage.clear();
    localStorage.removeItem('name');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    navigate('/auth/login', { replace: true });
  };

  const navItems = [
    { name: 'Kỳ thi của tôi', path: '/student/exams', icon: <BookOpen size={20} /> },
    { name: 'Kết quả học tập', path: '/student/results', icon: <Award size={20} /> },
    { name: 'Tài khoản', path: '/student/profile', icon: <User size={20} /> },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex bg-[#f8fafc] text-slate-800 min-h-screen">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Hexagon className="text-indigo-600 mr-2" fill="currentColor" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            ExamPortal
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 ml-3">
            Dành cho thí sinh
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm border border-indigo-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`
              }
            >
              <div className="flex items-center justify-center">{item.icon}</div>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-inner">
                {firstLetter}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <p className="text-xs font-medium text-indigo-600">Học viên</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="font-bold text-lg flex items-center text-indigo-600">
              <Hexagon size={22} className="mr-2" fill="currentColor" /> ExamPortal
            </div>
          </div>

          <div className="hidden md:flex items-center text-sm font-medium text-slate-500">
            Xin chào {userName}! Chúc bạn hoàn thành bài thi thật xuất sắc.
          </div>

          <button
            onClick={handleLogout}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
            aria-label="Đăng xuất"
            type="button"
          >
            <LogOut size={16} />
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2 shadow-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50/50">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
