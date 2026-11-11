import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/lib/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Màn lỗi: nói rõ chuyện gì xảy ra và cách sửa. */
export function ErrorState({
  title = 'Không tải được dữ liệu',
  message = 'Đã có lỗi xảy ra khi tải dữ liệu. Kiểm tra kết nối rồi thử lại.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-pen/30 bg-pen-wash px-6 py-12 text-center"
    >
      <AlertCircle className="size-5 text-pen" aria-hidden="true" />
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 max-w-[52ch] text-sm text-slate">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
