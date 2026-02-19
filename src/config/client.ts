import { createPublicClient, http, defineChain } from "viem";

export const DEFAULT_RPC_URL = "https://rpc.hyperliquid.xyz/evm";

export const hyperEvmMainnet = defineChain({
  id: 999,
  name: "HyperEVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: [DEFAULT_RPC_URL] },
  },
});

export function makePublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: hyperEvmMainnet,
    transport: http(rpcUrl || DEFAULT_RPC_URL),
  });
}
