import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/lib/ui/button';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime, formatScore } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useExamResults } from '@/features/results/hooks/useResults';
import { ScoreBadge } from '@/features/results/components/ScoreBadge';
import type { Result } from '@/features/results/types';

export function ExamScoreboardPage() {
  const { examId } = useParams();
  const id = examId ? Number(examId) : null;
  const resultsQuery = useExamResults(id);
  const [nameFilter, setNameFilter] = useState('');

  const data = resultsQuery.data;

  const rows = useMemo(() => {
    const all = data?.results ?? [];
    const term = nameFilter.trim().toLowerCase();
    if (!term) return all;
    return all.filter((result) => result.studentName.toLowerCase().includes(term));
  }, [data, nameFilter]);

  const chartData = useMemo(() => {
    const distribution = data?.statistics.distribution;
    if (!distribution) return [];
    return [
      { label: '0 – 2', count: distribution.from0To2 },
      { label: '2 – 4', count: distribution.from2To4 },
      { label: '4 – 6', count: distribution.from4To6 },
      { label: '6 – 8', count: distribution.from6To8 },
      { label: '8 – 10', count: distribution.from8To10 },
    ];
  }, [data]);

  const columns: Column<Result>[] = [
    {
      id: 'rank',
      header: 'Hạng',
      cell: (result) => <span className="tabular font-semibold text-ink">{result.rank ?? '—'}</span>,
    },
    {
      id: 'studentName',
      header: 'Họ tên',
      cell: (result) => <span className="font-medium text-ink">{result.studentName}</span>,
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
    {
      id: 'submittedAt',
      header: 'Thời điểm nộp',
      hideBelow: 'sm',
      cell: (result) => (
        <span className="tabular text-sm text-slate">{formatDateTime(result.submittedAt)}</span>
      ),
    },
  ];

  if (resultsQuery.isPending) {
    return <p className="text-sm text-slate">Đang tải bảng điểm…</p>;
  }

  if (resultsQuery.isError) {
    return (
      <ErrorState
        title="Không xem được bảng điểm"
        message={getApiErrorMessage(resultsQuery.error)}
        onRetry={() => void resultsQuery.refetch()}
      />
    );
  }

  if (!data) return null;

  const { statistics } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.examTitle}
        description={`${statistics.totalSubmitted} bài đã nộp.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/results">Tất cả kỳ thi</Link>
          </Button>
        }
      />

      <dl className="grid gap-4 rounded-md border border-rule bg-paper-raised p-5 sm:grid-cols-4">
        <Stat label="Điểm trung bình" value={formatScore(statistics.average)} />
        <Stat label="Điểm cao nhất" value={formatScore(statistics.highest)} />
        <Stat label="Điểm thấp nhất" value={formatScore(statistics.lowest)} />
        <Stat label="Số bài đã nộp" value={statistics.totalSubmitted} />
      </dl>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Phân bố điểm</h2>
        <div className="h-64 rounded-md border border-rule bg-paper-raised p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--slate)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--slate)" fontSize={12} width={32} />
              <Tooltip
                cursor={{ fill: 'var(--chalk-wash)' }}
                contentStyle={{
                  border: '1px solid var(--rule)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                }}
              />
              <Bar dataKey="count" name="Số học sinh" fill="var(--chalk)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Bảng điểm</h2>
          <div className="w-full max-w-xs space-y-1.5">
            <label htmlFor="scoreboard-search" className="text-sm font-medium text-ink">
              Lọc theo tên thí sinh
            </label>
            <input
              id="scoreboard-search"
              value={nameFilter}
              placeholder="Nhập tên…"
              onChange={(event) => setNameFilter(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Không có thí sinh phù hợp"
            description="Chưa có ai nộp bài, hoặc tên lọc không khớp."
          />
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(result) => result.id} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate">{label}</dt>
      <dd className="tabular mt-0.5 text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}
