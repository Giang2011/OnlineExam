import { cn } from '@/shared/utils/cn';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

/** Điểm thang 10 — màu theo ngưỡng đạt/không đạt. */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const tone =
    score >= 8
      ? 'border-jade/40 bg-jade-wash text-jade'
      : score >= 5
        ? 'border-chalk/40 bg-chalk-wash text-chalk-deep'
        : 'border-pen/40 bg-pen-wash text-pen';

  return (
    <span
      className={cn(
        'tabular inline-flex items-center rounded border px-2 py-0.5 text-sm font-semibold',
        tone,
        className,
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
