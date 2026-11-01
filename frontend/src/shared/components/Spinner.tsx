import React from 'react';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
};

export const Spinner: React.FC<SpinnerProps> = ({ className = '', size = 'md' }) => (
  <span className={[ 'inline-block animate-spin rounded-full border-slate-300 border-r-indigo-600', sizeStyles[size], className ].join(' ')} />
);

export default Spinner;
