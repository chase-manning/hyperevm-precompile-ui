import { describe, it, expect } from "vitest";
import {
  makePublicClient,
  DEFAULT_RPC_URL,
  hyperEvmMainnet,
} from "./client";

describe("client config", () => {
  it("exports the default RPC URL", () => {
    expect(DEFAULT_RPC_URL).toBe("https://rpc.hyperliquid.xyz/evm");
  });

  it("defines HyperEVM chain with correct id", () => {
    expect(hyperEvmMainnet.id).toBe(999);
  });

  it("defines HyperEVM chain with correct name", () => {
    expect(hyperEvmMainnet.name).toBe("HyperEVM");
  });

  it("defines native currency as HYPE", () => {
    expect(hyperEvmMainnet.nativeCurrency).toEqual({
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    });
  });
});

describe("makePublicClient", () => {
  it("creates a public client with default RPC", () => {
    const client = makePublicClient();
    expect(client).toBeDefined();
    expect(client.chain).toBeDefined();
    expect(client.chain!.id).toBe(999);
  });

  it("creates a public client with custom RPC URL", () => {
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
