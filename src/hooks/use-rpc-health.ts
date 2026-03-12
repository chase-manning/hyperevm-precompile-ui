import { useEffect, useState } from "react";
import type { PublicClient } from "viem";

export type RpcStatus = "checking" | "connected" | "slow" | "unreachable";

interface RpcHealth {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
  error: string | null;
}

/** Threshold in ms above which the connection is considered "slow". */
const SLOW_THRESHOLD_MS = 2000;

/**
 * Probes an RPC endpoint by calling `eth_blockNumber` and reports
 * connectivity status, current block number, and latency.
 *
 * Re-runs automatically whenever `publicClient` changes (i.e. when the
 * user switches RPC URLs).
 */
export function useRpcHealth(publicClient: PublicClient): RpcHealth {
  const [health, setHealth] = useState<RpcHealth>({
    status: "checking",
    blockNumber: null,
    latencyMs: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      setHealth({
        status: "checking",
        blockNumber: null,
        latencyMs: null,
        error: null,
      });

      const start = performance.now();
      try {
        const blockNumber = await publicClient.getBlockNumber();
        const elapsed = Math.round(performance.now() - start);

        if (cancelled) return;

        setHealth({
          status: elapsed > SLOW_THRESHOLD_MS ? "slow" : "connected",
          blockNumber,
          latencyMs: elapsed,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;

        setHealth({
          status: "unreachable",
          blockNumber: null,
          latencyMs: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    probe();

    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  return health;
}
