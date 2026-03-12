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
  lastUpdated: number | null;
  secondsAgo: number | null;
  intervals: RefreshInterval[];
}

export function useAutoRefresh({
  onRefresh,
  enabled,
  interval,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [currentInterval, setCurrentInterval] = useState<RefreshInterval>(interval);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;

  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      await onRefreshRef.current();
      setLastUpdated(Date.now());
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Handle auto-refresh polling
  useEffect(() => {
    if (!enabled || !isAutoRefreshing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (document.visibilityState === "visible") {
        doRefresh();
        timerRef.current = setInterval(doRefresh, currentInterval * 1000);
      }
    };

    // Start polling
    timerRef.current = setInterval(doRefresh, currentInterval * 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, isAutoRefreshing, currentInterval, doRefresh]);

  // Update "seconds ago" display
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

  return {
    isAutoRefreshing,
    setIsAutoRefreshing,
    interval: currentInterval,
    setInterval: setCurrentInterval,
    lastUpdated,
    secondsAgo,
    intervals: REFRESH_INTERVALS,
  };
}
