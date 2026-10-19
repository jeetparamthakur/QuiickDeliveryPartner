import { useEffect, useState } from 'react';

function elapsedMinutesSince(iso: string): number {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
}

/**
 * Live shift elapsed and today's online total (server snapshot + drift while online).
 */
export function useShiftClock(
  isOnline: boolean,
  currentShiftStartedAt: string | null,
  serverTodayOnlineMinutes: number,
  onlineMetricsSyncedAt: number,
) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isOnline]);

  const driftMinutes = isOnline
    ? Math.max(0, Math.floor((Date.now() - onlineMetricsSyncedAt) / 60000))
    : 0;
  const todayTotalMinutes = serverTodayOnlineMinutes + driftMinutes;
  const elapsedMinutes =
    isOnline && currentShiftStartedAt
      ? elapsedMinutesSince(currentShiftStartedAt)
      : 0;

  return {
    elapsedMinutes,
    todayTotalMinutes,
  };
}
