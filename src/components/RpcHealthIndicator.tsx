import type { RpcStatus } from "@/hooks/use-rpc-health";

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
    color: "bg-yellow-400",
    pulse: false,
    label: "Slow connection",
  },
  unreachable: {
    color: "bg-red-500",
    pulse: false,
    label: "Unreachable",
  },
};

interface RpcHealthIndicatorProps {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
}

export function RpcHealthIndicator({
  status,
  blockNumber,
  latencyMs,
}: RpcHealthIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.color}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`}
        />
      </span>
      <span>
        {config.label}
        {blockNumber !== null && (
          <span className="ml-1 text-muted-foreground/70">
            · Block {blockNumber.toString()}
          </span>
        )}
        {latencyMs !== null && (
          <span className="ml-1 text-muted-foreground/70">
            · {latencyMs}ms
          </span>
        )}
      </span>
    </div>
  );
}
