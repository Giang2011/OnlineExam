import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const toneStyles: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-indigo-100 text-indigo-700',
};

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'default', className = '' }) => (
  <span className={[ 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', toneStyles[tone], className ].join(' ')}>
    {children}
  </span>
);

export default Badge;
