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
const POLL_INTERVAL_MS = 30_000;

async function probeRpc(
  publicClient: PublicClient,
  signal: AbortSignal,
  setHealth: (h: RpcHealth) => void
) {
  setHealth({ status: "checking", blockNumber: null, latencyMs: null });

  const start = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const blockNumber = await Promise.race([
      publicClient.getBlockNumber(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("RPC probe timed out")),
          TIMEOUT_MS
        );
        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);

    if (signal.aborted) return;

    setHealth({
      status: latencyMs > SLOW_THRESHOLD_MS ? "slow" : "connected",
      blockNumber,
      latencyMs,
    });
  } catch {
    clearTimeout(timer);
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

  const [recheckCounter, setRecheckCounter] = useState(0);

  useEffect(() => {
    let activeController: AbortController | null = null;

    function runProbe() {
      if (activeController) activeController.abort();
      activeController = new AbortController();
      probeRpc(publicClient, activeController.signal, setHealth);
    }

    runProbe();

    const interval = setInterval(runProbe, POLL_INTERVAL_MS);

    return () => {
      if (activeController) activeController.abort();
      clearInterval(interval);
    };
  }, [publicClient, recheckCounter]);

  const recheck = useCallback(() => {
    setRecheckCounter((c) => c + 1);
  }, []);

  return { ...health, recheck };
}
