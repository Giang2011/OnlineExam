import { toast } from 'sonner';
import { ApiError } from '@/shared/types/api-error';

/**
 * Hiển thị lỗi API theo quy tắc của backend:
 * - 403 → toast "không có quyền", KHÔNG redirect.
 * - 413 → giới hạn dung lượng.
 * - 4xx khác → message backend nguyên văn.
 * - 5xx → thông báo chung.
 */
export function showApiError(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): void {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
      return;
    }
    toast.error(error.message || fallback);
    return;
  }
  toast.error(fallback);
}

/** Lấy message lỗi để hiển thị cạnh field của form. */
export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra.'): string {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}
