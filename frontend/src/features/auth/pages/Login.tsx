import React from 'react';
import { Lock } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

const Login: React.FC = () => {
  const { values, loading, error, setField, submit } = useLogin();

  return (
    <div className="mx-auto max-w-sm animate-in zoom-in fade-in duration-500">
      <div className="mb-10 text-center">
        <div className="premium-gradient mx-auto mb-6 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl shadow-2xl shadow-indigo-200">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tight text-slate-900">Hệ Thống Thi Online</h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Chào mừng trở lại!</p>
      </div>

      <LoginForm values={values} loading={loading} error={error} onChange={setField} onSubmit={submit} />
    </div>
  );
};

export default Login;
