import { useState, useEffect, useRef, useCallback } from "react";

export type RefreshInterval = 5 | 10 | 30;

const REFRESH_INTERVALS: RefreshInterval[] = [5, 10, 30];

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled: boolean;
  interval: RefreshInterval;
}

interface UseAutoRefreshReturn {
  isAutoRefreshing: boolean;
  setIsAutoRefreshing: (value: boolean) => void;
  interval: RefreshInterval;
  setInterval: (value: RefreshInterval) => void;
  secondsUntilRefresh: number | null;
  lastUpdatedAt: number | null;
  secondsSinceUpdate: number | null;
  availableIntervals: RefreshInterval[];
}

export function useAutoRefresh({
  onRefresh,
  enabled,
  interval,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [currentInterval, setCurrentInterval] =
    useState<RefreshInterval>(interval);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number | null>(
    null
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number | null>(
    null
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep the callback ref up to date
  onRefreshRef.current = onRefresh;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      await onRefreshRef.current();
      setLastUpdatedAt(Date.now());
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Main polling effect
  useEffect(() => {
    if (!enabled || !isAutoRefreshing) {
      clearTimers();
      setSecondsUntilRefresh(null);
      return;
    }

    const intervalMs = currentInterval * 1000;

    // Start countdown
    setSecondsUntilRefresh(currentInterval);

    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev === null || prev <= 1) return currentInterval;
        return prev - 1;
      });
    }, 1000);

    // Start refresh timer
    timerRef.current = setInterval(() => {
      doRefresh();
      setSecondsUntilRefresh(currentInterval);
    }, intervalMs);

    return clearTimers;
  }, [enabled, isAutoRefreshing, currentInterval, clearTimers, doRefresh]);

  // Pause when tab is not visible
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearTimers();
        setSecondsUntilRefresh(null);
      } else if (document.visibilityState === "visible") {
        // Trigger an immediate refresh when coming back, then restart the timer
        doRefresh();
        setSecondsUntilRefresh(currentInterval);

        const intervalMs = currentInterval * 1000;

        countdownRef.current = setInterval(() => {
          setSecondsUntilRefresh((prev) => {
            if (prev === null || prev <= 1) return currentInterval;
            return prev - 1;
          });
        }, 1000);

        timerRef.current = setInterval(() => {
          doRefresh();
          setSecondsUntilRefresh(currentInterval);
        }, intervalMs);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAutoRefreshing, currentInterval, clearTimers, doRefresh]);

  // Update "seconds since last update" every second
  useEffect(() => {
    if (lastUpdatedAt === null) {
      setSecondsSinceUpdate(null);
      return;
    }

    const update = () => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt) / 1000));
    };
    update();

    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  return {
    isAutoRefreshing,
    setIsAutoRefreshing,
    interval: currentInterval,
    setInterval: setCurrentInterval,
    secondsUntilRefresh,
    lastUpdatedAt,
    secondsSinceUpdate,
    availableIntervals: REFRESH_INTERVALS,
  };
}
