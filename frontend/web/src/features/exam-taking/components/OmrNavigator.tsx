import { cn } from '@/shared/utils/cn';

interface OmrNavigatorProps {
  total: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  onSelect: (index: number) => void;
  className?: string;
}

/**
 * Lưới điều hướng kiểu phiếu OMR — yếu tố nhớ duy nhất của sản phẩm.
 * Ô vuông theo số câu, tô đậm khi đã trả lời.
 */
export function OmrNavigator({
  total,
  currentIndex,
  answeredIndexes,
  onSelect,
  className,
}: OmrNavigatorProps) {
  return (
    <nav aria-label="Danh sách câu hỏi" className={cn('w-full', className)}>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const answered = answeredIndexes.has(index);
          const current = index === currentIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ', chưa trả lời'}`}
              className={cn(
                'tabular h-9 w-9 rounded-sm border text-sm font-medium transition-colors',
                current
                  ? 'border-chalk bg-chalk text-white'
                  : answered
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule-strong bg-paper-raised text-slate hover:border-chalk',
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-ink bg-ink" aria-hidden="true" />
          Đã trả lời
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-rule-strong bg-paper-raised" aria-hidden="true" />
          Chưa trả lời
        </span>
      </div>
    </nav>
  );
}
