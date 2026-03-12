import { useCallback, useEffect, useRef, useState } from "react";

export type RefreshInterval = 5 | 10 | 30;

export const REFRESH_INTERVALS: { value: RefreshInterval; label: string }[] = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
];

interface UseAutoRefreshOptions {
  /** Whether auto-refresh is allowed (e.g., after first query with valid inputs) */
  enabled: boolean;
  /** The callback to invoke on each refresh tick */
  onRefresh: () => Promise<void>;
  /** Polling interval in seconds */
  interval: RefreshInterval;
}

interface UseAutoRefreshReturn {
  /** Whether auto-refresh is currently active */
  isActive: boolean;
  /** Toggle auto-refresh on/off */
  toggle: () => void;
  /** Stop auto-refresh */
  stop: () => void;
  /** Seconds since last successful refresh, or null if never refreshed */
  secondsAgo: number | null;
  /** Whether a background refresh is currently in progress */
  isRefreshing: boolean;
}

export function useAutoRefresh({
  enabled,
  onRefresh,
  interval,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isActive, setIsActive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isRefreshingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Keep the callback ref up to date
  onRefreshRef.current = onRefresh;

  // Stop if conditions are no longer met
  useEffect(() => {
    if (!enabled && isActive) {
      setIsActive(false);
    }
  }, [enabled, isActive]);

  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
      setLastUpdated(Date.now());
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  // Main polling interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      doRefresh();
    }, interval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, interval, doRefresh]);

  // Ticker to update "seconds ago" display every second
  useEffect(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }

    if (lastUpdated === null) {
      setSecondsAgo(null);
      return;
    }

    const updateSecondsAgo = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    };

    updateSecondsAgo();
    tickerRef.current = setInterval(updateSecondsAgo, 1000);

    return () => {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [lastUpdated]);

  // Pause when tab is hidden, resume when visible
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab became visible again — refresh immediately and restart interval
        doRefresh();
        intervalRef.current = setInterval(() => {
          doRefresh();
        }, interval * 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive, interval, doRefresh]);

  const toggle = useCallback(() => {
    setIsActive((prev) => {
      if (!prev && enabled) {
        // Starting auto-refresh — do an immediate refresh
        doRefresh();
        return true;
      }
      return !prev;
    });
  }, [enabled, doRefresh]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    toggle,
    stop,
    secondsAgo,
    isRefreshing,
  };
}
