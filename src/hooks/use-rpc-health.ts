import { useEffect, useState, useRef, useCallback } from "react";
import type { PublicClient } from "viem";

export type RpcStatus = "checking" | "connected" | "slow" | "unreachable";

export interface RpcHealth {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
}

const SLOW_THRESHOLD_MS = 2000;

async function probeRpc(
  publicClient: PublicClient,
  signal: AbortSignal,
  setHealth: (h: RpcHealth) => void
) {
  setHealth({ status: "checking", blockNumber: null, latencyMs: null });

  const start = performance.now();
  try {
    const blockNumber = await publicClient.getBlockNumber();
    const latencyMs = Math.round(performance.now() - start);

    if (signal.aborted) return;

    setHealth({
      status: latencyMs > SLOW_THRESHOLD_MS ? "slow" : "connected",
      blockNumber,
      latencyMs,
    });
  } catch {
    if (signal.aborted) return;

    setHealth({
      status: "unreachable",
      blockNumber: null,
      latencyMs: null,
    });
  }
}

export function useRpcHealth(publicClient: PublicClient) {
  const [health, setHealth] = useState<RpcHealth>({
    status: "checking",
    blockNumber: null,
    latencyMs: null,
  });

  const recheckRef = useRef(0);
  const [recheckCounter, setRecheckCounter] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    probeRpc(publicClient, controller.signal, setHealth);
    return () => {
      controller.abort();
    };
  }, [publicClient, recheckCounter]);

  const recheck = useCallback(() => {
    setRecheckCounter((c) => c + 1);
    recheckRef.current += 1;
  }, []);

  return { ...health, recheck };
}
