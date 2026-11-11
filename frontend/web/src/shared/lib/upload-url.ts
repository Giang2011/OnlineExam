import { API_BASE_URL } from '@/shared/lib/api-client';

const UPLOADS_BASE_URL = (
  import.meta.env.VITE_UPLOADS_BASE_URL || `${API_BASE_URL}/uploads`
).replace(/\/$/, '');

/**
 * Chuẩn hoá đường dẫn ảnh từ backend về URL tuyệt đối.
 * Backend có thể trả về: filename trần, "uploads/...", "/uploads/..." hoặc URL đầy đủ.
 */
export function resolveUploadUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  const raw = imageUrl.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('data:')) return raw;

  const withoutLeadingSlash = raw.replace(/^\/+/, '');
  const uploadsIndex = withoutLeadingSlash.indexOf('uploads/');
  // Base URL đã kết thúc bằng "uploads" — chỉ lấy phần đường dẫn sau "uploads/"
  // để tránh sinh ra URL lặp ("/uploads/uploads/...").
  const relative = uploadsIndex >= 0 ? withoutLeadingSlash.slice(uploadsIndex + 'uploads/'.length) : withoutLeadingSlash;

  return `${UPLOADS_BASE_URL}/${relative}`;
}
