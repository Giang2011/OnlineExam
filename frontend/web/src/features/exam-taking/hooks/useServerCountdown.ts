import { useMemo } from 'react';
import { useClock } from '@/shared/hooks/useClock';

interface ServerClock {
  /** Số giây còn lại theo server, đã trừ độ trôi của request. */
  remainingSeconds: number;
  /** true nếu đồng hồ máy lệch quá 2 giây so với server. */
  desynced: boolean;
}

/**
 * Đồng hồ đếm ngược bám theo server.
 *
 * Nguồn sự thật là server: `deadlineAt` và `serverTime` nằm trong cùng một response
 * nên `remaining = (deadlineAt - serverTime) / 1000` là số giây còn lại tại thời điểm
 * server gửi response. Ta neo đồng hồ vào con số đó rồi trừ dần theo thời gian
 * thực trôi qua ở máy người thi.
 *
 * Nhờ vậy đổi tab, đổi đồng hồ máy hay mạng chậm đều không làm lệch đồng hồ thi.
 */
export function useServerCountdown(
  serverTime: string | null | undefined,
  deadlineAt: string | null | undefined,
  remainingSeconds: number | null | undefined,
): ServerClock {
  const clock = useClock();

  return useMemo(() => {
    if (!serverTime) {
      return { remainingSeconds: 0, desynced: false };
    }

    const serverMs = new Date(serverTime).getTime();
    const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : Number.NaN;

    let base: number;
    if (!Number.isNaN(serverMs) && !Number.isNaN(deadlineMs)) {
      base = (deadlineMs - serverMs) / 1000;
    } else if (remainingSeconds !== null && remainingSeconds !== undefined) {
      base = remainingSeconds;
    } else {
      base = 0;
    }

    // Mỗi nhịp 500ms trừ đi 0.5 giây — không phụ thuộc đồng hồ hệ thống.
    const elapsed = clock.tick * 0.5;
    const desynced = !Number.isNaN(serverMs) && Math.abs(serverMs - clock.now) > 2000;

    return {
      remainingSeconds: base - elapsed,
      desynced,
    };
  }, [serverTime, deadlineAt, remainingSeconds, clock.tick, clock.now]);
}
