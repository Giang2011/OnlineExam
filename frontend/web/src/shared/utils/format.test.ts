import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatScore,
  toDateTimeLocal,
  toIsoString,
} from '@/shared/utils/format';

describe('formatScore', () => {
  it('luôn hiển thị 1 chữ số thập phân', () => {
    expect(formatScore(7)).toBe('7.0');
    expect(formatScore(7.25)).toBe('7.3');
    expect(formatScore(0)).toBe('0.0');
  });

  it('trả "—" khi thiếu giá trị', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
    expect(formatScore(Number.NaN)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('định dạng mm:ss khi dưới 1 giờ', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(59)).toBe('00:59');
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('định dạng h:mm:ss khi từ 1 giờ trở lên', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7325)).toBe('2:02:05');
  });

  it('không trả số âm cho giá trị âm', () => {
    expect(formatDuration(-10)).toBe('00:00');
  });
});

describe('formatDate / formatDateTime', () => {
  it('trả "—" khi thiếu giá trị', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('trả nguyên chuỗi gốc khi ngày không hợp lệ', () => {
    expect(formatDate('không-phải-ngày')).toBe('không-phải-ngày');
    expect(formatDateTime('không-phải-ngày')).toBe('không-phải-ngày');
  });

  it('định dạng ngày hợp lệ theo locale vi-VN', () => {
    expect(formatDate('2026-03-06T00:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDateTime('2026-03-06T08:30:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('toIsoString / toDateTimeLocal', () => {
  it('trả chuỗi rỗng khi không có giá trị', () => {
    expect(toIsoString('')).toBe('');
    expect(toDateTimeLocal(null)).toBe('');
    expect(toDateTimeLocal(undefined)).toBe('');
  });

  it('giữ nguyên chuỗi không parse được', () => {
    expect(toIsoString('abc')).toBe('abc');
    expect(toDateTimeLocal('abc')).toBe('');
  });

  it('chuyển datetime-local sang ISO đầy đủ', () => {
    // datetime-local là giờ local — kết quả ISO phụ thuộc múi giờ máy,
    // nên chỉ assert rằng đầu ra là ISO hợp lệ và trùng ngày giờ local.
    const iso = toIsoString('2026-05-01T08:00');
    expect(iso).toMatch(/^2026-05-01T\d{2}:\d{2}:\d{2}\.000Z$/);
    expect(new Date(iso).getFullYear()).toBe(2026);
  });

  it('chuyển ISO sang định dạng cho input datetime-local', () => {
    expect(toDateTimeLocal('2026-05-01T08:30:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
