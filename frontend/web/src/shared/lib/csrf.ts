const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Đọc giá trị cookie không HttpOnly (XSRF-TOKEN cố tình không set HttpOnly). */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/** Lấy CSRF token hiện tại (null nếu chưa có cookie). */
export function getCsrfToken(): string | null {
  return readCookie(CSRF_COOKIE);
}

/** Header CSRF cần gắn cho request có thay đổi trạng thái. */
export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  if (!token) return {};
  return { [CSRF_HEADER]: token };
}

/** Request này có cần header CSRF không. */
export function requiresCsrf(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}
