import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerCountdown } from '@/features/exam-taking/hooks/useServerCountdown';

const clock = { tick: 0, now: 0 };

vi.mock('@/shared/hooks/useClock', () => ({
  useClock: () => ({ tick: clock.tick, now: clock.now }),
}));

describe('useServerCountdown', () => {
  beforeEach(() => {
    clock.tick = 0;
    clock.now = Date.now();
  });

  it('trả 0 khi chưa có serverTime', () => {
    const { result } = renderHook(() => useServerCountdown(null, null, null));
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.desynced).toBe(false);
  });

  it('tính số giây còn lại từ deadlineAt trừ serverTime', () => {
    const { result } = renderHook(() =>
      useServerCountdown('2026-03-06T08:00:00Z', '2026-03-06T08:10:00Z', null),
    );
    expect(result.current.remainingSeconds).toBeCloseTo(600, 5);
  });

  it('dùng remainingSeconds khi thiếu deadlineAt', () => {
    const { result } = renderHook(() =>
      useServerCountdown('2026-03-06T08:00:00Z', null, 300),
    );
    expect(result.current.remainingSeconds).toBeCloseTo(300, 5);
  });

  it('báo desynced khi đồng hồ máy lệch quá 2 giây so với server', () => {
    const serverTime = new Date(clock.now + 60_000).toISOString();
    const { result } = renderHook(() => useServerCountdown(serverTime, null, 300));
    expect(result.current.desynced).toBe(true);
  });

  it('không báo desynced khi đồng hồ máy khớp server', () => {
    const serverTime = new Date(clock.now).toISOString();
    const { result } = renderHook(() => useServerCountdown(serverTime, null, 300));
    expect(result.current.desynced).toBe(false);
  });

  it('trừ 0.5 giây cho mỗi nhịp đồng hồ đã qua', () => {
    const { result, rerender } = renderHook(() =>
      useServerCountdown('2026-03-06T08:00:00Z', '2026-03-06T08:10:00Z', null),
    );

    expect(result.current.remainingSeconds).toBeCloseTo(600, 5);

    clock.tick = 2;
    rerender();

    expect(result.current.remainingSeconds).toBeCloseTo(599, 5);
  });
});
