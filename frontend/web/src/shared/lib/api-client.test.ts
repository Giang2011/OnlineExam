import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, apiRequest, setUnauthorizedHandler } from '@/shared/lib/api-client';
import { ApiError } from '@/shared/types/api-error';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; path=/; max-age=0';
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gửi credentials include cho mọi request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/things');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/things');
    expect(init.credentials).toBe('include');
    expect(init.method).toBe('GET');
  });

  it('gắn header X-XSRF-TOKEN cho POST khi có cookie', async () => {
    document.cookie = 'XSRF-TOKEN=tok-abc; path=/';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/things', { a: 1 });

    const headers: Headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get('X-XSRF-TOKEN')).toBe('tok-abc');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('không gắn CSRF header cho GET', async () => {
    document.cookie = 'XSRF-TOKEN=tok-abc; path=/';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/things');

    const headers: Headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get('X-XSRF-TOKEN')).toBeNull();
  });

  it('không set Content-Type khi body là FormData', async () => {
    document.cookie = 'XSRF-TOKEN=tok-abc; path=/';
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/upload', new FormData());

    const headers: Headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('X-XSRF-TOKEN')).toBe('tok-abc');
  });

  it('parse JSON khi response là JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 7 })));
    await expect(api.get<{ id: number }>('/things/7')).resolves.toEqual({ id: 7 });
  });

  it('ném ApiError với message nguyên văn từ backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'Kỳ thi không tìm thấy.' }, 404)));

    await expect(api.get('/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Kỳ thi không tìm thấy.',
    });
  });

  it('dùng message mặc định cho 403 khi backend không trả message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 403)));

    await expect(api.get('/forbidden')).rejects.toThrow(
      'Bạn không có quyền thực hiện thao tác này.',
    );
  });

  it('gọi handler 401 khi không skipUnauthorizedHandling', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('không gọi handler 401 khi skipUnauthorizedHandling', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(
      apiRequest('/auth/login', { method: 'POST', skipUnauthorizedHandling: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('trả undefined cho response 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(api.delete('/things/1')).resolves.toBeUndefined();
  });
});
