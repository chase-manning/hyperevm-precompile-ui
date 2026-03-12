import type { RpcStatus } from "@/hooks/use-rpc-health";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  RpcStatus,
  { color: string; pulse: boolean; label: string }
> = {
  checking: {
    color: "bg-yellow-400",
    pulse: true,
    label: "Checking connection…",
  },
  connected: {
    color: "bg-green-500",
    pulse: false,
    label: "Connected",
  },
  slow: {
    color: "bg-yellow-500",
    pulse: false,
    label: "Connected (slow)",
  },
  unreachable: {
    color: "bg-red-500",
    pulse: false,
    label: "Unreachable",
  },
};

interface RpcStatusIndicatorProps {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
}

export function RpcStatusIndicator({
  status,
  blockNumber,
  latencyMs,
}: RpcStatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.color
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            config.color
          )}
        />
      </span>
      <span>
        {config.label}
        {blockNumber != null && ` · Block ${blockNumber.toLocaleString()}`}
        {latencyMs != null && ` · ${latencyMs}ms`}
      </span>
    </span>
  );
}
