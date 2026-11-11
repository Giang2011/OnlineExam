import { cn } from '@/shared/utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Phân trang dùng chung cho cả phân trang server-side lẫn client-side. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex items-center justify-between gap-3 text-sm', className)} aria-label="Phân trang">
      <p className="tabular text-slate">
        Trang {page + 1} / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-rule bg-paper-raised px-3 py-1.5 font-medium text-ink transition-colors hover:bg-paper-sunken disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          Trước
        </button>
        <button
          type="button"
          className="rounded-md border border-rule bg-paper-raised px-3 py-1.5 font-medium text-ink transition-colors hover:bg-paper-sunken disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Sau
        </button>
      </div>
    </nav>
  );
}