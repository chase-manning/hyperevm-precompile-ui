import { describe, it, expect } from "vitest";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

describe("CONTRACT_ADDRESS", () => {
  it("is a valid hex address", () => {
    expect(CONTRACT_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});

describe("CONTRACT_ABI", () => {
  const functionEntries = CONTRACT_ABI.filter(
    (entry) => entry.type === "function"
  );
  const errorEntries = CONTRACT_ABI.filter((entry) => entry.type === "error");

  it("contains function entries", () => {
    expect(functionEntries.length).toBeGreaterThan(0);
  });

  it("contains error entries", () => {
    expect(errorEntries.length).toBeGreaterThan(0);
  });

  it("all functions are view-only", () => {
    for (const fn of functionEntries) {
      expect((fn as { stateMutability: string }).stateMutability).toBe("view");
    }
  });

  const expectedFunctions = [
    "getL1BlockNumber",
    "getCoreUserExists",
    "getWithdrawable",
    "getOraclePx",
    "getMarkPx",
    "getBbo",
    "getPerpAssetInfo",
    "getPosition",
    "getAccountMarginSummary",
    "getSpotBalance",
    "getSpotInfo",
    "getSpotPx",
    "getTokenInfo",
    "getTokenSupply",
    "getUserVaultEquity",
    "getDelegations",
    "getDelegatorSummary",
  ];

  it.each(expectedFunctions)(
    "includes function %s in the ABI",
    (functionName) => {
      const found = functionEntries.some(
        (entry) => (entry as { name: string }).name === functionName
      );
      expect(found).toBe(true);
    }
  );

  it("all function entries have outputs defined", () => {
    for (const fn of functionEntries) {
      expect(
        (fn as unknown as { outputs: readonly unknown[] }).outputs.length
      ).toBeGreaterThanOrEqual(1);
    }
  });
});
