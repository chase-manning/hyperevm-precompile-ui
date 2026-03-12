import type { RpcStatus } from "@/hooks/use-rpc-health";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  RpcStatus,
  { color: string; pulse: boolean; label: string }
> = {
  checking: {
    color: "bg-yellow-400",
    pulse: true,
    label: "Checking RPC connection…",
  },
  connected: {
    color: "bg-green-500",
    pulse: false,
    label: "RPC connected",
  },
  slow: {
    color: "bg-yellow-400",
    pulse: false,
    label: "RPC responding slowly",
  },
  unreachable: {
    color: "bg-destructive",
    pulse: false,
    label: "RPC unreachable",
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
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full shrink-0",
          config.color,
          config.pulse && "animate-pulse"
        )}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-foreground" aria-live="polite">
        {config.label}
        {blockNumber !== null && (
          <>
            {" · "}
            <span title="Latest block number">
              Block {blockNumber.toLocaleString()}
            </span>
          </>
        )}
        {latencyMs !== null && (
          <>
            {" · "}
            <span title="Round-trip latency">{latencyMs}ms</span>
          </>
        )}
      </span>
    </div>
  );
}
