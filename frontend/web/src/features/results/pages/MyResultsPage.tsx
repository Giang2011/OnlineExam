import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Pagination } from '@/shared/components/Pagination';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useMyResults } from '@/features/results/hooks/useResults';
import { ScoreBadge } from '@/features/results/components/ScoreBadge';
import type { Result } from '@/features/results/types';

const PAGE_SIZE = 15;

export function MyResultsPage() {
  const resultsQuery = useMyResults();
  const [page, setPage] = useState(0);

  const rows = useMemo(() => resultsQuery.data ?? [], [resultsQuery.data]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const columns: Column<Result>[] = [
    {
      id: 'examTitle',
      header: 'Kỳ thi',
      cell: (result) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{result.examTitle}</p>
          <p className="mt-0.5 text-xs text-slate">Nộp lúc {formatDateTime(result.submittedAt)}</p>
        </div>
      ),
    },
    {
      id: 'correct',
      header: 'Đúng / tổng',
      cell: (result) => (
        <span className="tabular text-sm text-slate">
          {result.totalCorrect} / {result.totalQuestions}
        </span>
      ),
    },
    {
      id: 'score',
      header: 'Điểm',
      cell: (result) => <ScoreBadge score={result.score} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Kết quả của tôi" description="Lịch sử các bài thi bạn đã nộp." />

      {resultsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải kết quả…</p>
      ) : resultsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(resultsQuery.error)}
          onRetry={() => void resultsQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Chưa có kết quả nào"
          description="Khi bạn nộp bài, điểm sẽ hiển thị ở đây."
          action={
            <Link
              to="/my-exams"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-chalk-deep"
            >
              Xem kỳ thi của tôi
            </Link>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={pageRows} rowKey={(result) => result.id} />
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
