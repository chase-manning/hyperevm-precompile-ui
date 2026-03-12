import { describe, it, expect } from "vitest";
import { makePublicClient, DEFAULT_RPC_URL, hyperEvmMainnet } from "./client";

describe("hyperEvmMainnet", () => {
  it("has chain id 999", () => {
    expect(hyperEvmMainnet.id).toBe(999);
  });

  it("uses HYPE as native currency", () => {
    expect(hyperEvmMainnet.nativeCurrency).toEqual({
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    });
  });
});

describe("makePublicClient", () => {
  it("creates a client with default RPC URL", () => {
    const client = makePublicClient();
    expect(client).toBeDefined();
    expect(client.chain?.id).toBe(999);
  });

  it("creates a client with a custom RPC URL", () => {
    const client = makePublicClient("https://custom-rpc.example.com");
    expect(client).toBeDefined();
    expect(client.chain?.id).toBe(999);
  });

  it("exports the default RPC URL", () => {
    expect(DEFAULT_RPC_URL).toBe("https://rpc.hyperliquid.xyz/evm");
  });
});
