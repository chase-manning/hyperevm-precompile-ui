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

  // Combine the caller's cleanup signal with a timeout signal so the
  // underlying fetch is actually cancelled when either fires.
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

  let settled = false;

  const start = performance.now();
  try {
    const blockNumber = await publicClient.getBlockNumber({
      signal: combinedSignal,
    } as any);
    const latencyMs = Math.round(performance.now() - start);

    if (settled || signal.aborted) return;
    settled = true;

    setHealth({
      status: latencyMs > SLOW_THRESHOLD_MS ? "slow" : "connected",
      blockNumber,
      latencyMs,
    });
  } catch {
    if (settled || signal.aborted) return;
    settled = true;

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
