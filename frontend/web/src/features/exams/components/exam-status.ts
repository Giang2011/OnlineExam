import type { ExamStatus } from '@/features/exams/types';

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  UPCOMING: 'Sắp diễn ra',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
};

export const EXAM_STATUS_STYLE: Record<ExamStatus, string> = {
  UPCOMING: 'border-chalk/40 bg-chalk-wash text-chalk-deep',
  ONGOING: 'border-jade/40 bg-jade-wash text-jade',
  COMPLETED: 'border-rule bg-paper-sunken text-slate',
};
