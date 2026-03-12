import { useEffect, useState, useCallback } from "react";
import type { PublicClient } from "viem";

export type RpcStatus = "checking" | "connected" | "slow" | "unreachable";

export interface RpcHealth {
  status: RpcStatus;
  blockNumber: bigint | null;
  latencyMs: number | null;
}

const SLOW_THRESHOLD_MS = 2000;
const TIMEOUT_MS = 10_000;

async function probeRpc(
  publicClient: PublicClient,
  signal: AbortSignal,
  setHealth: (h: RpcHealth) => void
) {
  setHealth({ status: "checking", blockNumber: null, latencyMs: null });

  const timeoutId = setTimeout(() => {
    if (!signal.aborted) {
      setHealth({ status: "unreachable", blockNumber: null, latencyMs: null });
    }
  }, TIMEOUT_MS);

  const start = performance.now();
  try {
    const blockNumber = await publicClient.getBlockNumber();
    const latencyMs = Math.round(performance.now() - start);

    clearTimeout(timeoutId);
    if (signal.aborted) return;

    setHealth({
      status: latencyMs > SLOW_THRESHOLD_MS ? "slow" : "connected",
      blockNumber,
      latencyMs,
    });
  } catch {
    clearTimeout(timeoutId);
    if (signal.aborted) return;

    setHealth({
      status: "unreachable",
      blockNumber: null,
      latencyMs: null,
    });
  }
}

export function useRpcHealth(publicClient: PublicClient, rpcUrl?: string) {
  const [health, setHealth] = useState<RpcHealth>({
    status: "checking",
    blockNumber: null,
    latencyMs: null,
  });

  const [recheckCounter, setRecheckCounter] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    probeRpc(publicClient, controller.signal, setHealth);
    return () => {
      controller.abort();
    };
  }, [publicClient, recheckCounter, rpcUrl]);

  const recheck = useCallback(() => {
    setRecheckCounter((c) => c + 1);
  }, []);

  return { ...health, recheck };
}
