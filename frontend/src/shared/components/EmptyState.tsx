import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, className = '' }) => (
  <div className={[ 'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center', className ].join(' ')}>
    <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-500">
      <Inbox size={24} />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export default EmptyState;
