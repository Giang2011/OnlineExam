import { useSyncExternalStore } from 'react';

/**
 * Đồng hồ dùng chung: tự tăng mỗi 500ms và thông báo cho các subscriber.
 * Dùng `useSyncExternalStore` để lấy giá trị mà không cần setState trong effect.
 *
 * `now` là mốc thời gian thực ở lần tick gần nhất — dùng để phát hiện đồng hồ máy
 * lệch so với server mà không cần gọi `Date.now()` trong lúc render.
 */
const TICK_INTERVAL_MS = 500;

interface ClockSnapshot {
  tick: number;
  now: number;
}

let snapshot: ClockSnapshot = { tick: 0, now: Date.now() };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    const timer = window.setInterval(() => {
      snapshot = { tick: snapshot.tick + 1, now: Date.now() };
      for (const notify of listeners) notify();
    }, TICK_INTERVAL_MS);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.clearInterval(timer);
    };
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ClockSnapshot {
  return snapshot;
}

/** Số nhịp đã trôi qua kể từ khi app mở, kèm mốc thời gian thực ở lần tick gần nhất. */
export function useClock(): ClockSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
