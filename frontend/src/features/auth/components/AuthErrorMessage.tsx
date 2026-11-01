import React from 'react';

interface AuthErrorMessageProps {
  message?: string;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({ message, className = '' }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={[
        'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700',
        className,
      ].join(' ')}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default AuthErrorMessage;
