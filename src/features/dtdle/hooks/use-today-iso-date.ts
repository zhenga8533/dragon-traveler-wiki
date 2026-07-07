import { useEffect, useState } from 'react';
import { getTodayIsoDate } from '../utils/daily-answer';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Tracks today's ISO date, refreshing on an interval and whenever the tab
 * regains focus/visibility. A plain one-time computation would freeze the
 * date at mount, so a tab left open across midnight would keep serving
 * yesterday's puzzle until a hard reload.
 */
export function useTodayIsoDate(): string {
  const [todayStr, setTodayStr] = useState(getTodayIsoDate);

  useEffect(() => {
    const refresh = () => setTodayStr(getTodayIsoDate());
    const interval = setInterval(refresh, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return todayStr;
}
