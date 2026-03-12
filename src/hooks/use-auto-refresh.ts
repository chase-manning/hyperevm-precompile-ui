import { useCallback, useEffect, useRef, useState } from "react";

export type RefreshInterval = 5 | 10 | 30;

const REFRESH_INTERVALS: RefreshInterval[] = [5, 10, 30];

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled: boolean;
  interval: RefreshInterval;
}

interface UseAutoRefreshReturn {
  /** Whether auto-refresh is currently active */
  isActive: boolean;
  /** Toggle auto-refresh on/off */
  setActive: (active: boolean) => void;
  /** Current interval in seconds */
  interval: RefreshInterval;
  /** Set the refresh interval */
  setInterval: (interval: RefreshInterval) => void;
  /** Available interval options */
  intervals: readonly RefreshInterval[];
  /** Timestamp of last successful refresh (null if never refreshed) */
  lastUpdated: number | null;
  /** Seconds since last update (null if never refreshed) */
  secondsAgo: number | null;
}

export function useAutoRefresh({
  onRefresh,
  enabled,
  interval,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentInterval, setCurrentInterval] =
    useState<RefreshInterval>(interval);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep the callback ref current
  onRefreshRef.current = onRefresh;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Update "seconds ago" every second
  useEffect(() => {
    if (lastUpdated === null) {
      setSecondsAgo(null);
      return;
    }

    const update = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    };

    update();
    tickRef.current = setInterval(update, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [lastUpdated]);

  // Main polling effect
  useEffect(() => {
    if (!isActive || !enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const doRefresh = async () => {
      if (isRefreshingRef.current) return;

      // Pause when tab is not visible
      if (document.visibilityState === "hidden") return;

      isRefreshingRef.current = true;
      try {
        await onRefreshRef.current();
        setLastUpdated(Date.now());
      } finally {
        isRefreshingRef.current = false;
      }
    };

    timerRef.current = setInterval(doRefresh, currentInterval * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, enabled, currentInterval, clearTimers]);

  // Stop auto-refresh when tab becomes hidden, resume when visible
  useEffect(() => {
    if (!isActive || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Re-start polling when tab becomes visible again
        const doRefresh = async () => {
          if (isRefreshingRef.current) return;
          isRefreshingRef.current = true;
          try {
            await onRefreshRef.current();
            setLastUpdated(Date.now());
          } finally {
            isRefreshingRef.current = false;
          }
        };

        // Immediately refresh on becoming visible
        doRefresh();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(doRefresh, currentInterval * 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive, enabled, currentInterval, clearTimers]);

  // Clean up on unmount
  useEffect(() => clearTimers, [clearTimers]);

  return {
    isActive,
    setActive: setIsActive,
    interval: currentInterval,
    setInterval: setCurrentInterval,
    intervals: REFRESH_INTERVALS,
    lastUpdated,
    secondsAgo,
  };
}
