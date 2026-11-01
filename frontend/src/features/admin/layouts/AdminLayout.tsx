import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Book, HelpCircle, Calendar, FileText, LogOut, LayoutDashboard, User, Files } from 'lucide-react';
import { authStorage } from '../../../shared/lib/authStorage';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const role = authStorage.getRole();
  const userName = authStorage.getName() || (role === 'ADMIN' ? 'Administrator' : 'Teacher');
  const firstLetter = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    authStorage.clear();
    navigate('/auth/login');
  };

  const menuItems = [
    { path: '/admin/users', name: 'Người dùng', icon: Users },
    { path: '/admin/subjects', name: 'Môn học', icon: Book },
    { path: '/admin/questions', name: 'Nội dung câu hỏi', icon: HelpCircle },
    { path: '/admin/exams', name: 'Kỳ thi', icon: Calendar },
    { path: '/admin/paper-exams', name: 'Đề giấy', icon: Files },
    { path: '/admin/reports', name: 'Báo cáo - Điểm', icon: FileText },
    { path: '/admin/profile', name: 'Hồ sơ cá nhân', icon: User },
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sidebar */}
      <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 sticky top-0 h-screen transition-all duration-300">
        <div className="h-20 flex items-center px-8 border-b border-white/5 bg-slate-950">
          <div className="premium-gradient p-2 rounded-xl shadow-lg shadow-indigo-500/20 mr-3">
            <LayoutDashboard className="text-white" size={20} />
          </div>
          <span className="text-white font-black text-xl tracking-tighter">
            {role === 'ADMIN' ? 'ADMIN' : 'TEACHER'}<span className="text-indigo-500"></span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-4 opacity-60">Management Console</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xl shadow-indigo-900/40 translate-x-1'
                    : 'hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={`mr-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span className="text-[15px]">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-950/30">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-5 py-4 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all duration-300 group"
          >
            <div className="bg-slate-800 p-2 rounded-lg mr-4 transition-colors group-hover:bg-red-500/20">
              <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            </div>
            <span className="font-semibold text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center px-10 sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-0.5">Examination System</h2>
            <div className="text-slate-900 font-bold text-xl tracking-tight">Dashboard Overview</div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <div className="flex items-center px-3 py-1.5 gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 leading-none">{userName}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter mt-1">{role}</span>
              </div>
              <div className="w-10 h-10 rounded-xl premium-gradient text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-200">
                {firstLetter}
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-10 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
