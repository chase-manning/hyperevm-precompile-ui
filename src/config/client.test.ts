import { describe, it, expect } from "vitest";
import {
  makePublicClient,
  DEFAULT_RPC_URL,
  hyperEvmMainnet,
} from "./client";

describe("hyperEvmMainnet", () => {
  it("has chain id 999", () => {
    expect(hyperEvmMainnet.id).toBe(999);
  });

  it("uses HYPE as native currency", () => {
    expect(hyperEvmMainnet.nativeCurrency.symbol).toBe("HYPE");
    expect(hyperEvmMainnet.nativeCurrency.decimals).toBe(18);
  });
});

describe("DEFAULT_RPC_URL", () => {
  it("points to hyperliquid RPC", () => {
    expect(DEFAULT_RPC_URL).toBe("https://rpc.hyperliquid.xyz/evm");
  });
});

describe("makePublicClient", () => {
  it("returns a public client with the correct chain", () => {
    const client = makePublicClient();
    expect(client.chain).toEqual(hyperEvmMainnet);
  });

  it("returns a public client when given a custom RPC URL", () => {
    const client = makePublicClient("https://custom-rpc.example.com");
    expect(client.chain).toEqual(hyperEvmMainnet);
  });

  it("returns different instances for different calls", () => {
    const a = makePublicClient();
    const b = makePublicClient();
    expect(a).not.toBe(b);
  });
});
