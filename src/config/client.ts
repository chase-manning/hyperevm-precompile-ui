import { createPublicClient, http, defineChain } from "viem";

export const hyperEvmMainnet = defineChain({
  id: 999,
  name: "HyperEVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hyperliquid.xyz/evm"] },
  },
});

export const publicClient = createPublicClient({
  chain: hyperEvmMainnet,
  transport: http(),
});
