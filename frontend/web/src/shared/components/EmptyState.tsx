import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Màn trống: lời mời hành động, không trang trí. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-rule-strong bg-paper-raised px-6 py-14 text-center',
        className,
      )}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="max-w-[52ch] text-sm text-slate">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
