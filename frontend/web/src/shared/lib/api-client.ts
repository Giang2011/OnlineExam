import { ApiError } from '@/shared/types/api-error';
import { csrfHeaders, requiresCsrf } from '@/shared/lib/csrf';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const DEFAULT_MESSAGE = 'Đã có lõi xảy ra. Vui lòng thử lại.';

export interface ErrorBody {
  status?: number;
  message?: string;
  timestamp?: string;
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Đăng ký hành động khi nhận 401 (chưa xác thực).
 * Router đăng ký hàm này để xoá session phía FE và chuyển hướng về trang đăng nhập.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const message = (body as ErrorBody).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 413) return 'File tải lên vượt quá giới hạn cho phép (tối đa 10MB mỗi file, 15MB mỗi lần tải).';
  return DEFAULT_MESSAGE;
}

async function readBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Bỏ qua handler 401 (dùng cho chính endpoint đăng nhập). */
  skipUnauthorizedHandling?: boolean;
  signal?: AbortSignal;
  /** Giữ request khi đóng trang (dùng cho autosave kèm keepalive). */
  keepalive?: boolean;
}

function buildHeaders(method: string, body: unknown): Headers {
  const headers = new Headers();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && body !== null && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  // FormData: KHÔNG set Content-Type để browser tự sinh boundary.

  if (requiresCsrf(method)) {
    for (const [key, value] of Object.entries(csrfHeaders())) {
      headers.set(key, value);
    }
  }
  return headers;
}

/** Gọi API có xử lý lỗi tập trung. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = buildHeaders(method, options.body);

  let payload: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    payload =
      typeof options.body === 'string' || options.body instanceof FormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    credentials: 'include',
    signal: options.signal,
    keepalive: options.keepalive,
  });

  if (!response.ok) {
    const body = await readBody(response);
    const message = extractMessage(body, response.status);

    if (response.status === 401 && !options.skipUnauthorizedHandling) {
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

/** Tải file nhị phân (PDF), trả về Blob. */
export async function apiDownload(path: string): Promise<Blob> {
  const headers = buildHeaders('GET', undefined);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await readBody(response);
    const message = extractMessage(body, response.status);
    if (response.status === 401) unauthorizedHandler?.();
    throw new ApiError(response.status, message, body);
  }
  return response.blob();
}
