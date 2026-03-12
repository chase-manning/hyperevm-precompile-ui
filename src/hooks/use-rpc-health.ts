import { useState, useEffect, useCallback } from "react";
import type { PublicClient } from "viem";

export type RpcStatus = "checking" | "connected" | "slow" | "unreachable";

export interface RpcHealthState {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
}

/** Threshold in milliseconds above which a response is considered "slow". */
const SLOW_THRESHOLD_MS = 2000;

const CHECKING_STATE: RpcHealthState = {
  status: "checking",
  blockNumber: null,
  latencyMs: null,
};

/**
 * Probe the RPC endpoint by calling `eth_blockNumber`.
 * Returns the current health state including status, block number, and latency.
 */
async function probeRpc(client: PublicClient): Promise<RpcHealthState> {
  const start = performance.now();
  try {
    const blockNumber = await client.getBlockNumber();
    const latencyMs = Math.round(performance.now() - start);
    const status: RpcStatus =
      latencyMs > SLOW_THRESHOLD_MS ? "slow" : "connected";
    return { status, blockNumber, latencyMs };
  } catch {
    return { status: "unreachable", blockNumber: null, latencyMs: null };
  }
}

/**
 * Hook that monitors the health of an RPC endpoint.
 *
 * On mount and whenever the `publicClient` identity changes (i.e. the user
 * switched RPC URLs), a lightweight probe call is fired to verify connectivity.
 */
export function useRpcHealth(publicClient: PublicClient): RpcHealthState & {
  recheck: () => void;
} {
  const [state, setState] = useState<RpcHealthState>(CHECKING_STATE);

  // A counter that, when bumped, triggers a re-probe inside the effect.
  const [probeKey, setProbeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    probeRpc(publicClient).then((result) => {
      if (!cancelled) {
        setState(result);
      }
    });

    return () => {
      cancelled = true;
      // Reset to checking so the next render shows "checking" immediately.
      setState(CHECKING_STATE);
    };
  }, [publicClient, probeKey]);

  const recheck = useCallback(() => {
    setProbeKey((k) => k + 1);
  }, []);

  return { ...state, recheck };
}
