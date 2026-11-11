import { cn } from '@/shared/utils/cn';
import { EXAM_STATUS_LABEL, EXAM_STATUS_STYLE } from '@/features/exams/components/exam-status';
import type { ExamStatus } from '@/features/exams/types';

export function ExamStatusBadge({ status, className }: { status: ExamStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        EXAM_STATUS_STYLE[status],
        className,
      )}
    >
      {EXAM_STATUS_LABEL[status]}
    </span>
  );
}
