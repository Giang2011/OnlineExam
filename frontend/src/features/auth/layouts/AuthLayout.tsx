import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, getLandingPath } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getLandingPath()} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
