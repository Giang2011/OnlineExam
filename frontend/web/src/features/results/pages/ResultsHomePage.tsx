import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useExams } from '@/features/exams/hooks/useExams';
import type { Exam } from '@/features/exams/types';

export function ResultsHomePage() {
  const examsQuery = useExams();
  const [keyword, setKeyword] = useState('');

  const rows = useMemo(() => {
    const all = examsQuery.data ?? [];
    const term = keyword.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (exam) => exam.title.toLowerCase().includes(term) || exam.subjectName.toLowerCase().includes(term),
    );
  }, [examsQuery.data, keyword]);

  const columns: Column<Exam>[] = [
    {
      id: 'title',
      header: 'Kỳ thi',
      cell: (exam) => (
        <div className="min-w-0">
          <Link to={`/results/exam/${exam.id}`} className="font-medium text-ink hover:text-chalk">
            {exam.title}
          </Link>
          <p className="mt-0.5 text-xs text-slate">{exam.subjectName}</p>
        </div>
      ),
    },
    {
      id: 'time',
      header: 'Thời gian',
      hideBelow: 'sm',
      cell: (exam) => <span className="tabular text-sm text-slate">{formatDateTime(exam.startTime)}</span>,
    },
    {
      id: 'participants',
      header: 'Thí sinh',
      hideBelow: 'md',
      cell: (exam) => <span className="tabular text-sm text-slate">{exam.participantCount}</span>,
    },
    {
      id: 'action',
      header: <span className="sr-only">Thao tác</span>,
      cell: (exam) => (
        <div className="flex justify-end">
          <Link
            to={`/results/exam/${exam.id}`}
            className="text-sm font-medium text-chalk hover:text-chalk-deep"
          >
            Xem bảng điểm
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điểm"
        description="Chọn một kỳ thi để xem điểm, thống kê và phân bố điểm của các thí sinh."
      />

      <div className="max-w-sm space-y-1.5">
        <label htmlFor="result-search" className="text-sm font-medium text-ink">
          Tìm kỳ thi
        </label>
        <input
          id="result-search"
          value={keyword}
          placeholder="Nhập tên kỳ thi hoặc môn học…"
          onChange={(event) => setKeyword(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
        />
      </div>

      {examsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải kỳ thi…</p>
      ) : examsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(examsQuery.error)}
          onRetry={() => void examsQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="Không có kỳ thi phù hợp" description="Thử xoá từ khoá tìm kiếm." />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(exam) => exam.id} />
      )}
    </div>
  );
}
