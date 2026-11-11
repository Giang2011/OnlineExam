import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/dialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useExam, useParticipants, useAddParticipant, useRemoveParticipant } from '@/features/exams/hooks/useExams';
import { useUsers } from '@/features/users/hooks/useUsers';
import { ExamStatusBadge } from '@/features/exams/components/ExamStatusBadge';
import type { ExamParticipant } from '@/features/exams/types';

export function ExamDetailPage() {
  const { examId } = useParams();
  const id = examId ? Number(examId) : null;

  const examQuery = useExam(id);
  const participantsQuery = useParticipants(id);
  const addParticipant = useAddParticipant();
  const removeParticipant = useRemoveParticipant();

  const [addOpen, setAddOpen] = useState(false);

  const exam = examQuery.data;

  const columns: Column<ExamParticipant>[] = [
    {
      id: 'name',
      header: 'Họ tên',
      cell: (participant) => <span className="font-medium text-ink">{participant.name}</span>,
    },
    {
      id: 'studentId',
      header: 'Mã sinh viên',
      cell: (participant) => <span className="tabular">{participant.studentId ?? '—'}</span>,
    },
    {
      id: 'username',
      header: 'Tên đăng nhập',
      hideBelow: 'sm',
      cell: (participant) => <span className="tabular text-slate">{participant.username}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      cell: (participant) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá thí sinh ${participant.name}`}
            onClick={() => id && removeParticipant.mutate({ examId: id, userId: participant.id })}
          >
            <UserMinus className="size-4 text-pen" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  if (examQuery.isPending) {
    return <p className="text-sm text-slate">Đang tải kỳ thi…</p>;
  }

  if (examQuery.isError) {
    return (
      <ErrorState message={getApiErrorMessage(examQuery.error)} onRetry={() => void examQuery.refetch()} />
    );
  }

  if (!exam) return null;

  const participants = participantsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={exam.title}
        description={`${exam.subjectName} · ${formatDateTime(exam.startTime)} → ${formatDateTime(exam.endTime)}`}
        actions={
          <>
            <ExamStatusBadge status={exam.status} />
            {exam.status === 'UPCOMING' ? (
              <Button asChild variant="outline">
                <Link to={`/exams/${exam.id}/edit`}>Sửa kỳ thi</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to={`/results/exam/${exam.id}`}>Bảng điểm</Link>
            </Button>
          </>
        }
      />

      <dl className="grid gap-4 rounded-md border border-rule bg-paper-raised p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tổng số câu" value={exam.totalQuestions} />
        <Stat label="Số đề" value={exam.totalVariants} />
        <Stat label="Thời lượng" value={`${exam.duration} phút`} />
        <Stat label="Lượt thi tối đa" value={exam.maxAttempts} />
        <Stat label="Thí sinh" value={exam.participantCount} />
        <Stat label="Trạng thái" value={exam.status} />
      </dl>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Thí sinh</h2>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" aria-hidden="true" />
            Thêm thí sinh
          </Button>
        </div>

        {participantsQuery.isPending ? (
          <p className="text-sm text-slate">Đang tải danh sách thí sinh…</p>
        ) : participantsQuery.isError ? (
          <ErrorState
            message={getApiErrorMessage(participantsQuery.error)}
            onRetry={() => void participantsQuery.refetch()}
          />
        ) : participants.length === 0 ? (
          <EmptyState
            title="Kỳ thi chưa có thí sinh"
            description="Thêm học sinh vào kỳ thi để họ có thể làm bài."
          />
        ) : (
          <DataTable columns={columns} rows={participants} rowKey={(participant) => participant.id} />
        )}
      </section>

        <AddParticipantDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          existingIds={participants.map((participant) => participant.id)}
          isPending={addParticipant.isPending}
          onAdd={(userId) => {
            if (id) return addParticipant.mutateAsync({ examId: id, userId });
            return Promise.resolve();
          }}
        />
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

function AddParticipantDialog({
  open,
  onOpenChange,
  existingIds,
  isPending,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: number[];
  isPending: boolean;
  onAdd: (userId: number) => Promise<unknown>;
}) {
  const usersQuery = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [serverError, setServerError] = useState<string | null>(null);

  const candidates = useMemo(
    () =>
      (usersQuery.data ?? []).filter(
        (user) => user.role === 'STUDENT' && !existingIds.includes(user.id),
      ),
    [usersQuery.data, existingIds],
  );

  const handleAdd = async () => {
    if (selectedUserId === '') return;
    setServerError(null);
    try {
      await onAdd(selectedUserId);
      setSelectedUserId('');
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không thêm được thí sinh.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thí sinh</DialogTitle>
          <DialogDescription>Chỉ học sinh mới được thêm vào kỳ thi.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="participant-select" className="text-sm font-medium text-ink">
            Học sinh
          </label>
          <select
            id="participant-select"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value ? Number(event.target.value) : '')}
            className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
          >
            <option value="">Chọn học sinh</option>
            {candidates.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.studentId ?? user.username})
              </option>
            ))}
          </select>
          {candidates.length === 0 ? (
            <p className="text-xs text-slate">Không còn học sinh nào để thêm.</p>
          ) : null}
        </div>

        {serverError ? (
          <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
            {serverError}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="button" disabled={selectedUserId === '' || isPending} onClick={() => void handleAdd()}>
            {isPending ? 'Đang thêm…' : 'Thêm vào kỳ thi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
