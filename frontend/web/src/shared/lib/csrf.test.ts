import { beforeEach, describe, expect, it } from 'vitest';
import { csrfHeaders, getCsrfToken, readCookie, requiresCsrf } from '@/shared/lib/csrf';

describe('csrf', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; path=/; max-age=0';
    document.cookie = 'PLAIN=; path=/; max-age=0';
  });

  it('đọc cookie thường', () => {
    document.cookie = 'PLAIN=abc; path=/';
    expect(readCookie('PLAIN')).toBe('abc');
  });

  it('giải mã cookie URL-encode', () => {
    document.cookie = 'PLAIN=a%20b%2Bc; path=/';
    expect(readCookie('PLAIN')).toBe('a b+c');
  });

  it('trả null khi không có cookie', () => {
    expect(readCookie('MISSING')).toBeNull();
  });

  it('không nhầm cookie có tiền tố giống nhau', () => {
    document.cookie = 'TOKEN=real; path=/';
    expect(readCookie('TOKEN')).toBe('real');
    expect(readCookie('TOK')).toBeNull();
  });

  it('trả null khi chưa có XSRF-TOKEN', () => {
    expect(getCsrfToken()).toBeNull();
    expect(csrfHeaders()).toEqual({});
  });

  it('trả header X-XSRF-TOKEN khi có token', () => {
    document.cookie = 'XSRF-TOKEN=tok-123; path=/';
    expect(getCsrfToken()).toBe('tok-123');
    expect(csrfHeaders()).toEqual({ 'X-XSRF-TOKEN': 'tok-123' });
  });

  it('không yêu cầu CSRF cho method an toàn', () => {
    expect(requiresCsrf('GET')).toBe(false);
    expect(requiresCsrf('get')).toBe(false);
    expect(requiresCsrf('HEAD')).toBe(false);
    expect(requiresCsrf('OPTIONS')).toBe(false);
  });

  it('yêu cầu CSRF cho method thay đổi trạng thái', () => {
    expect(requiresCsrf('POST')).toBe(true);
    expect(requiresCsrf('PUT')).toBe(true);
    expect(requiresCsrf('PATCH')).toBe(true);
    expect(requiresCsrf('DELETE')).toBe(true);
  });
});
