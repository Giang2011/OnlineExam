import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Lock, Key, Save, Loader2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import { authStorage } from '../../../shared/lib/authStorage';

interface ProfileFormData {
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const role = authStorage.getRole();
  const canEditProfile = useMemo(() => role === 'ADMIN' || role === 'TEACHER', [role]);

  useEffect(() => {
    const savedName = authStorage.getName() || '';
    const savedUsername = localStorage.getItem('username') || '';

    setFormData((prev) => ({
      ...prev,
      name: savedName,
      username: savedUsername,
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditProfile) {
      toast.error('Bạn không có quyền cập nhật hồ sơ.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const payload: { name: string; username: string; password?: string } = {
        name: formData.name.trim(),
        username: formData.username.trim(),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const updatedUser = await userApi.updateMe(payload);

      authStorage.setName(updatedUser.name);
      localStorage.setItem('username', updatedUser.username);

      toast.success('Cập nhật thông tin cá nhân thành công.');
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 mt-2 font-medium">Quản lý thông tin tài khoản và bảo mật của bạn</p>
      </div>

      <div className="modern-card p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Họ và tên hiển thị</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Key size={16} className="text-indigo-600" />
              Thay đổi mật khẩu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || !canEditProfile}
              className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} /> Lưu thông tin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
