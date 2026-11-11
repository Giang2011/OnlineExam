import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Đầu trang: tiêu đề + mô tả + hành động. Canh trái, không eyebrow. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-5', className)}>
      <div className="max-w-[70ch]">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
