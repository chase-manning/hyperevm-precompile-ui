import { describe, it, expect } from "vitest";
import { DEFAULT_RPC_URL, hyperEvmMainnet, makePublicClient } from "./client";

describe("DEFAULT_RPC_URL", () => {
  it("points to the Hyperliquid EVM RPC", () => {
    expect(DEFAULT_RPC_URL).toBe("https://rpc.hyperliquid.xyz/evm");
  });
});

describe("hyperEvmMainnet", () => {
  it("has correct chain id", () => {
    expect(hyperEvmMainnet.id).toBe(999);
  });

  it("has correct chain name", () => {
    expect(hyperEvmMainnet.name).toBe("HyperEVM");
  });

  it("has correct native currency", () => {
    expect(hyperEvmMainnet.nativeCurrency).toEqual({
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    });
  });
});

describe("makePublicClient", () => {
  it("creates a client without arguments", () => {
    const client = makePublicClient();
    expect(client).toBeDefined();
    expect(client.chain).toBeDefined();
    expect(client.chain!.id).toBe(999);
  });

  it("creates a client with custom RPC URL", () => {
    const client = makePublicClient("https://custom-rpc.example.com");
    expect(client).toBeDefined();
    expect(client.chain!.id).toBe(999);
  });

  it("uses default RPC when empty string is provided", () => {
    const client = makePublicClient("");
    expect(client).toBeDefined();
    expect(client.chain!.id).toBe(999);
  });

  it("uses default RPC when undefined is provided", () => {
    const client = makePublicClient(undefined);
    expect(client).toBeDefined();
    expect(client.chain!.id).toBe(999);
  });
});
