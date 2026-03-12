import type { RefreshInterval } from "@/hooks/use-auto-refresh";

interface AutoRefreshControlsProps {
  isAutoRefreshing: boolean;
  onToggle: (value: boolean) => void;
  interval: RefreshInterval;
  onIntervalChange: (value: RefreshInterval) => void;
  intervals: RefreshInterval[];
  secondsAgo: number | null;
}

export function AutoRefreshControls({
  isAutoRefreshing,
  onToggle,
  interval,
  onIntervalChange,
  intervals,
  secondsAgo,
}: AutoRefreshControlsProps) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={isAutoRefreshing}
            onClick={() => onToggle(!isAutoRefreshing)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
              isAutoRefreshing ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-0 transition-transform ${
                isAutoRefreshing ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs text-muted-foreground select-none">
            Auto-refresh
          </span>
          {isAutoRefreshing && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
        </div>

        {isAutoRefreshing && (
          <div className="flex items-center gap-1">
            {intervals.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onIntervalChange(opt)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  interval === opt
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {opt}s
              </button>
            ))}
          </div>
        )}
      </div>

      {isAutoRefreshing && secondsAgo !== null && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Last updated: {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
        </p>
      )}
    </div>
  );
}
