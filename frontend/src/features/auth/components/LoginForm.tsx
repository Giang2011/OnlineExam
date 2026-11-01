import React from 'react';
import { Lock, User } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import AuthErrorMessage from './AuthErrorMessage';
import type { LoginRequest } from '../types/auth.types';

interface LoginFormProps {
  values: LoginRequest;
  loading: boolean;
  error?: string;
  onChange: (field: keyof LoginRequest, value: string) => void;
  onSubmit: () => void | Promise<unknown>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ values, loading, error, onChange, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthErrorMessage message={error} />

      <div className="space-y-2">
        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500" htmlFor="username">
          Tên đăng nhập
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-600">
            <User size={20} />
          </div>
          <Input
            id="username"
            name="username"
            value={values.username}
            onChange={(e) => onChange('username', e.target.value)}
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
            className="h-12 border-slate-200 bg-slate-50/50 pl-12 pr-4 text-[15px] font-medium hover:bg-white focus:bg-white"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500" htmlFor="password">
          Mật khẩu
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-indigo-600">
            <Lock size={20} />
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            value={values.password}
            onChange={(e) => onChange('password', e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 border-slate-200 bg-slate-50/50 pl-12 pr-4 text-[15px] font-medium hover:bg-white focus:bg-white"
            disabled={loading}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        isLoading={loading}
        disabled={loading}
        className="h-12 w-full rounded-2xl text-sm font-black uppercase tracking-widest"
      >
        Đăng nhập
      </Button>
    </form>
  );
};

export default LoginForm;
